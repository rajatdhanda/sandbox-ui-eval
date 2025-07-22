// hooks/use-daily-activities.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface ActivitySchedule {
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
  progress_summary?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface ChildProgress {
  child_id: string;
  child_name: string;
  attendance_status: 'present' | 'absent' | 'late';
  participation_level?: 'full' | 'partial' | 'minimal' | 'none';
  engagement_score?: number;
  skill_demonstration?: 'mastered' | 'developing' | 'emerging' | 'needs_support';
  notes?: string;
}

export function useDailyActivities(classId: string, date?: string) {
  const [activities, setActivities] = useState<ActivitySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activityDate = date || new Date().toISOString().split('T')[0];

  // Load today's activities with progress
  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.activities.getClassDailySchedule(classId, activityDate);
      
      if (result.error) throw result.error;
      
      // Enhance with progress summary
      const enhancedActivities = await Promise.all(
        (result.data || []).map(async (activity) => {
          const { count: total } = await db.supabase
            .from('progress_tracking')
            .select('*', { count: 'exact', head: true })
            .eq('curriculum_item_id', activity.curriculum_item_id)
            .eq('execution_date', activityDate);
            
          const { count: completed } = await db.supabase
            .from('progress_tracking')
            .select('*', { count: 'exact', head: true })
            .eq('curriculum_item_id', activity.curriculum_item_id)
            .eq('execution_date', activityDate)
            .eq('status', 'completed');
          
          return {
            ...activity,
            progress_summary: {
              total: total || 0,
              completed: completed || 0,
              percentage: total ? Math.round((completed || 0) / total * 100) : 0
            }
          };
        })
      );
      
      setActivities(enhancedActivities);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, activityDate]);

  // Mark activity complete for entire class
  const markClassComplete = useCallback(async (
    activityScheduleId: string,
    defaultPerformance = {
      participationLevel: 'full' as const,
      engagementScore: 4,
      skillDemonstration: 'developing' as const
    }
  ) => {
    try {
      const result = await db.activities.markClassActivityComplete(
        activityScheduleId,
        defaultPerformance
      );
      
      if (result.error) throw result.error;
      
      // Reload activities to update progress
      await loadActivities();
      
      return { success: true, data: result.data };
    } catch (err: any) {
      console.error('Error marking class complete:', err);
      return { success: false, error: err.message };
    }
  }, [loadActivities]);

  // Get children for activity with their current progress
  const getActivityChildren = useCallback(async (
    activityScheduleId: string
  ): Promise<ChildProgress[]> => {
    try {
      // Get enrolled children with attendance
      const { data: enrollments } = await db.supabase
        .from('child_class_assignments')
        .select(`
          child_id,
          children!inner(first_name, last_name),
          attendance_records!inner(status)
        `)
        .eq('class_id', classId)
        .eq('status', 'enrolled')
        .eq('attendance_records.attendance_date', activityDate);
      
      // Get existing progress
      const { data: progress } = await db.supabase
        .from('activity_progress')
        .select('*')
        .eq('activity_schedule_id', activityScheduleId);
      
      // Merge data
      return (enrollments || []).map(enrollment => {
        const childProgress = progress?.find(p => p.child_id === enrollment.child_id);
        
        return {
          child_id: enrollment.child_id,
          child_name: `${enrollment.children.first_name} ${enrollment.children.last_name}`,
          attendance_status: enrollment.attendance_records[0]?.status || 'absent',
          participation_level: childProgress?.participation_level,
          engagement_score: childProgress?.engagement_score,
          skill_demonstration: childProgress?.skill_demonstration,
          notes: childProgress?.teacher_observations
        };
      });
    } catch (err: any) {
      console.error('Error getting activity children:', err);
      return [];
    }
  }, [classId, activityDate]);

  // Update individual child progress
  const updateChildProgress = useCallback(async (
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
      const result = await db.activities.completeActivityForChild(
        activityScheduleId,
        childId,
        performance
      );
      
      if (result.error) throw result.error;
      
      return { success: true, data: result.data };
    } catch (err: any) {
      console.error('Error updating child progress:', err);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    if (classId) {
      loadActivities();
    }
  }, [classId, activityDate, loadActivities]);

  return {
    activities,
    loading,
    error,
    refresh: loadActivities,
    markClassComplete,
    getActivityChildren,
    updateChildProgress
  };
}