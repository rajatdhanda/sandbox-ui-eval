// hooks/use-teacher-daily-activities.ts
// Path: hooks/use-teacher-daily-activities.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/supabase/services/database.service';
import { useAttachments } from './use-attachments';

interface DailyActivity {
  id: string;
  curriculum_item_id: string;
  class_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  teacher_id?: string;
  curriculum_item?: {
    title: string;
    activity_type: string;
    kmap_dimensions: any;
    duration_minutes: number;
  };
  progress?: {
    total: number;
    completed: number;
    percentage: number;
  };
  children?: ActivityChild[];
}

interface ActivityChild {
  child_id: string;
  name: string;
  attendance: 'present' | 'absent' | 'late' | 'excused';
  progress_status?: 'scheduled' | 'completed' | 'partial' | 'skipped' | 'absent';
  quality_score?: number;
  engagement_level?: 'low' | 'medium' | 'high';
  teacher_notes?: string;
}

export function useTeacherDailyActivities(classId: string, date?: string) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadMultipleAttachments } = useAttachments();
  
  const activityDate = date || new Date().toISOString().split('T')[0];

  const loadTodaySchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[TeacherDaily] Loading schedule for:', { classId, activityDate });
      
      // Direct query instead of service method
      const { data: activities, error } = await db.supabase
        .from('activity_schedule')
        .select(`
          *,
          curriculum_item:curriculum_items(
            id,
            title,
            activity_type,
            duration_minutes,
            description,
            kmap_dimensions
          )
        `)
        .eq('class_id', classId)
        .eq('scheduled_date', activityDate)
        .order('scheduled_time', { ascending: true });
      
      if (error) throw error;
      
      console.log('[TeacherDaily] Found activities:', activities?.length || 0);
      
      // Get all enrolled children first
      const { data: enrolledChildren } = await db.supabase
        .from('child_class_assignments')
        .select(`
          child_id,
          children!inner(id, first_name, last_name)
        `)
        .eq('class_id', classId)
        .eq('status', 'enrolled');

      // Get attendance for all children
      const { data: attendance } = await db.supabase
        .from('attendance_records')
        .select('child_id, status')
        .eq('class_id', classId)
        .eq('attendance_date', activityDate);

      // Enhanced activities with all children
      const enhancedActivities = await Promise.all(
        (activities || []).map(async (activity) => {
          // Get progress data for this specific activity
          const { data: progressData } = await db.supabase
            .from('progress_tracking')
            .select('*')
            .eq('curriculum_item_id', activity.curriculum_item_id)
            .eq('execution_date', activityDate);

          // Map all enrolled children, not just those with progress
          const children: ActivityChild[] = (enrolledChildren || []).map(enrollment => {
            const childProgress = progressData?.find(p => p.child_id === enrollment.child_id);
            const childAttendance = attendance?.find(a => a.child_id === enrollment.child_id);
            
            return {
              child_id: enrollment.child_id,
              name: `${enrollment.children.first_name} ${enrollment.children.last_name}`,
              attendance: childAttendance?.status || 'absent',
              progress_status: childProgress?.status || 'scheduled',
              quality_score: childProgress?.quality_score,
              engagement_level: childProgress?.engagement_level,
              teacher_notes: childProgress?.teacher_notes
            };
          });

          const total = children.length;
          const completed = children.filter(c => c.progress_status === 'completed').length;

          return {
            ...activity,
            progress: {
              total,
              completed,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 0
            },
            children
          };
        })
      );

      setActivities(enhancedActivities);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
      console.error('[TeacherDaily] Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, activityDate]);

  const markClassComplete = useCallback(async (
    activityScheduleId: string,
    defaultPerformance = {
      participationLevel: 'full' as const,
      engagementScore: 4,
      skillDemonstration: 'developing' as const
    }
  ) => {
    try {
      const { data: { user } } = await db.supabase.auth.getUser();
      
      // Check if activities service exists, otherwise use direct approach
      if (db.activities && typeof db.activities.markClassActivityComplete === 'function') {
        const result = await db.activities.markClassActivityComplete(
          activityScheduleId,
          user?.id || '',
          defaultPerformance
        );
        
        if (result.error) throw result.error;
      } else {
        // Fallback: Direct database approach
        console.log('[TeacherDaily] Using direct approach for markClassComplete');
        
        // Get the activity details
        const activity = activities.find(a => a.id === activityScheduleId);
        if (!activity) throw new Error('Activity not found');
        
        // Get enrolled children who are present
        const { data: presentChildren } = await db.supabase
          .from('child_class_assignments')
          .select('child_id')
          .eq('class_id', classId)
          .eq('status', 'enrolled');
        
        if (!presentChildren || presentChildren.length === 0) {
          throw new Error('No children found for activity');
        }
        
        // Create progress records for all present children
        for (const child of presentChildren) {
          // Check if progress record already exists
          const { data: existing } = await db.supabase
            .from('progress_tracking')
            .select('id')
            .eq('child_id', child.child_id)
            .eq('curriculum_item_id', activity.curriculum_item_id)
            .eq('execution_date', activityDate)
            .maybeSingle();

          if (existing) {
            // Update existing record
            await db.supabase
              .from('progress_tracking')
              .update({
                status: 'completed',
                quality_score: defaultPerformance.engagementScore,
                engagement_level: defaultPerformance.skillDemonstration === 'mastered' ? 'high' : 
                                 defaultPerformance.skillDemonstration === 'developing' ? 'medium' : 'low',
                teacher_notes: `Class activity completed by ${user?.email || 'teacher'}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            // Create new record
            await db.supabase
              .from('progress_tracking')
              .insert({
                child_id: child.child_id,
                curriculum_item_id: activity.curriculum_item_id,
                execution_date: activityDate,
                status: 'completed',
                quality_score: defaultPerformance.engagementScore,
                engagement_level: defaultPerformance.skillDemonstration === 'mastered' ? 'high' : 
                                 defaultPerformance.skillDemonstration === 'developing' ? 'medium' : 'low',
                teacher_notes: `Class activity completed by ${user?.email || 'teacher'}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
        }
      }
      
      await loadTodaySchedule();
      return { success: true };
    } catch (err: any) {
      console.error('Error marking class complete:', err);
      return { success: false, error: err.message };
    }
  }, [classId, activities, activityDate, loadTodaySchedule]);

  const markIndividualComplete = useCallback(async (
    activityScheduleId: string,
    childId: string,
    performance: {
      participationLevel: 'full' | 'partial' | 'minimal' | 'none';
      engagementScore: number;
      skillDemonstration: 'mastered' | 'developing' | 'emerging' | 'needs_support';
      teacherObservations?: string;
    }
  ) => {
    try {
      // Find the activity to get curriculum_item_id
      const activity = activities.find(a => a.id === activityScheduleId);
      if (!activity) throw new Error('Activity not found');

      // First check if a progress record exists
      const { data: existingProgress } = await db.supabase
        .from('progress_tracking')
        .select('id')
        .eq('child_id', childId)
        .eq('execution_date', activityDate)
        .eq('curriculum_item_id', activity.curriculum_item_id)
        .maybeSingle(); // FIX: Use maybeSingle() to handle no rows gracefully

      if (existingProgress) {
        // Update existing record
        const { error } = await db.supabase
          .from('progress_tracking')
          .update({
            status: 'completed',
            quality_score: performance.engagementScore,
            engagement_level: performance.skillDemonstration === 'mastered' ? 'high' : 
                             performance.skillDemonstration === 'developing' ? 'medium' : 'low',
            teacher_notes: performance.teacherObservations,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new record if none exists
        const { data: newProgress, error: insertError } = await db.supabase
          .from('progress_tracking')
          .insert({
            child_id: childId,
            curriculum_item_id: activity.curriculum_item_id,
            execution_date: activityDate,
            status: 'completed',
            quality_score: performance.engagementScore,
            engagement_level: performance.skillDemonstration === 'mastered' ? 'high' : 
                             performance.skillDemonstration === 'developing' ? 'medium' : 'low',
            teacher_notes: performance.teacherObservations,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          // If it's a duplicate key error, try to update instead
          if (insertError.code === '23505') {
            const { data: existingRec } = await db.supabase
              .from('progress_tracking')
              .select('id')
              .eq('child_id', childId)
              .eq('curriculum_item_id', activity.curriculum_item_id)
              .eq('execution_date', activityDate)
              .single();

            if (existingRec) {
              const { error: updateError } = await db.supabase
                .from('progress_tracking')
                .update({
                  status: 'completed',
                  quality_score: performance.engagementScore,
                  engagement_level: performance.skillDemonstration === 'mastered' ? 'high' : 
                                   performance.skillDemonstration === 'developing' ? 'medium' : 'low',
                  teacher_notes: performance.teacherObservations,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRec.id);

              if (updateError) throw updateError;
            }
          } else {
            throw insertError;
          }
        }
      }

      // Update local state optimistically
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityScheduleId) {
          const updatedChildren = activity.children?.map(child => {
            if (child.child_id === childId) {
              return {
                ...child,
                progress_status: 'completed' as const,
                quality_score: performance.engagementScore,
                teacher_notes: performance.teacherObservations
              };
            }
            return child;
          });

          const completed = updatedChildren?.filter(c => c.progress_status === 'completed').length || 0;
          const total = updatedChildren?.length || 0;

          return {
            ...activity,
            children: updatedChildren,
            progress: {
              total,
              completed,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 0
            }
          };
        }
        return activity;
      }));

      return { success: true };
    } catch (err: any) {
      console.error('Error marking individual complete:', err);
      return { success: false, error: err.message };
    }
  }, [activities, activityDate]);

  const addQuickNote = useCallback(async (
    curriculumItemId: string,
    childId: string,
    note: string
  ) => {
    try {
      const { data: progress } = await db.supabase
        .from('progress_tracking')
        .select('id, teacher_notes')
        .eq('child_id', childId)
        .eq('curriculum_item_id', curriculumItemId)
        .eq('execution_date', activityDate)
        .maybeSingle(); // FIX: Use maybeSingle() to handle no rows gracefully

      if (!progress) {
        // Create new progress record if none exists
        const { data: newProgress, error: createError } = await db.supabase
          .from('progress_tracking')
          .insert({
            child_id: childId,
            curriculum_item_id: curriculumItemId,
            execution_date: activityDate,
            status: 'scheduled',
            teacher_notes: `[${new Date().toLocaleTimeString()}] ${note}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        
        // Update local state
        setActivities(prev => prev.map(activity => {
          if (activity.curriculum_item_id === curriculumItemId) {
            const updatedChildren = activity.children?.map(child => {
              if (child.child_id === childId) {
                return { ...child, teacher_notes: newProgress.teacher_notes };
              }
              return child;
            });
            return { ...activity, children: updatedChildren };
          }
          return activity;
        }));
        
        return { success: true };
      }

      const timestamp = new Date().toLocaleTimeString();
      const updatedNotes = progress.teacher_notes 
        ? `${progress.teacher_notes}\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;

      const { error } = await db.supabase
        .from('progress_tracking')
        .update({ 
          teacher_notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id);

      if (error) throw error;

      // Update local state
      setActivities(prev => prev.map(activity => {
        if (activity.curriculum_item_id === curriculumItemId) {
          const updatedChildren = activity.children?.map(child => {
            if (child.child_id === childId) {
              return { ...child, teacher_notes: updatedNotes };
            }
            return child;
          });
          return { ...activity, children: updatedChildren };
        }
        return activity;
      }));

      return { success: true };
    } catch (err: any) {
      console.error('Error adding note:', err);
      return { success: false, error: err.message };
    }
  }, [activityDate]);

  const bulkPhotoUpload = useCallback(async (
    activityScheduleId: string,
    photos: Array<{
      file_url: string;
      caption?: string;
      child_ids?: string[];
    }>
  ) => {
    try {
      // Get the user first
      const { data: { user } } = await db.supabase.auth.getUser();
      
      const attachments = photos.map(photo => ({
        activity_schedule_id: activityScheduleId,
        attachment_type: 'photo' as const,
        file_url: photo.file_url,
        caption: photo.caption,
        tags: photo.child_ids || [],
        parent_visible: true,
        created_by: user?.id || null
      }));

      const result = await uploadMultipleAttachments(attachments);
      
      return { success: true, count: result.length };
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      return { success: false, error: err.message };
    }
  }, [uploadMultipleAttachments]);

  const activitySummary = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const inProgress = activities.filter(a => a.status === 'in_progress').length;
    const scheduled = activities.filter(a => a.status === 'scheduled').length;
    
    return {
      total,
      completed,
      inProgress,
      scheduled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [activities]);

  useEffect(() => {
    if (classId) {
      loadTodaySchedule();
    }
  }, [classId, activityDate, loadTodaySchedule]);

  return {
    activities,
    loading,
    error,
    activitySummary,
    refresh: loadTodaySchedule,
    loadDailySchedule: loadTodaySchedule,  // Add this alias
    markClassComplete,
    markIndividualComplete,
    addQuickNote,
    bulkPhotoUpload
  };
}