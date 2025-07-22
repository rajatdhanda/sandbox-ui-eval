// hooks/use-learning-tracking.ts
// Path: hooks/use-learning-tracking.ts

import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface ProgressData {
  status: 'completed' | 'partial' | 'skipped';
  quality_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  teacher_notes?: string;
}

interface LearningDay {
  date: string;
  activities: any[];
  totalDuration: number;
  completedCount: number;
  kmapProgress: {
    move: number;
    think: number;
    endure: number;
  };
}

interface LearningTrends {
  period: 'week' | 'month' | 'term';
  totalActivities: number;
  completionRate: number;
  averageQuality: number;
  topDimension: string;
  improvementAreas: string[];
}

export function useLearningTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackProgress = useCallback(async (
    childId: string,
    curriculumItemId: string,
    progressData: ProgressData,
    executionDate?: string // Make execution date overrideable for backdated entries
  ) => {
    try {
      setLoading(true);
      setError(null);
      const targetDate = executionDate || new Date().toISOString().split('T')[0];
      
      // Validate quality score
      if (progressData.quality_score < 1 || progressData.quality_score > 5) {
        throw new Error('Quality score must be between 1 and 5');
      }
      
      // Get the current teacher
      const { data: { user } } = await db.supabase.auth.getUser();
      
      // First check if a progress record already exists
      const { data: existing } = await db.supabase
        .from('progress_tracking')
        .select('id')
        .eq('child_id', childId)
        .eq('curriculum_item_id', curriculumItemId)
        .eq('execution_date', targetDate)
        .maybeSingle();
      
      if (existing) {
        // Update existing record
        const { data, error } = await db.supabase
          .from('progress_tracking')
          .update({
            status: progressData.status,
            quality_score: progressData.quality_score,
            engagement_level: progressData.engagement_level,
            teacher_notes: progressData.teacher_notes,
            teacher_id: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, data, error: null };
      } else {
        // Create new record
        const { data, error } = await db.supabase
          .from('progress_tracking')
          .insert({
            child_id: childId,
            curriculum_item_id: curriculumItemId,
            execution_date: targetDate,
            execution_type: 'individual',
            status: progressData.status,
            quality_score: progressData.quality_score,
            engagement_level: progressData.engagement_level,
            teacher_notes: progressData.teacher_notes,
            teacher_id: user?.id,
            parent_visible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, data, error: null };
      }
    } catch (err: any) {
      console.error('Error tracking progress:', err);
      setError(err.message);
      return { success: false, data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const recordObservation = useCallback(async (
    childId: string,
    observation: {
      type: 'behavioral' | 'social' | 'emotional' | 'academic';
      description: string;
      tags?: string[];
      parentVisible?: boolean;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.supabase
        .from('informal_observations')
        .insert({
          child_id: childId,
          observation_type: observation.type,
          description: observation.description,
          tags: observation.tags || [],
          parent_visible: observation.parentVisible ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err: any) {
      console.error('Error recording observation:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildLearningDay = useCallback(async (
    childId: string,
    date: string
  ): Promise<LearningDay | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all activities for the day
      const { data: activities, error } = await db.supabase
        .from('progress_tracking')
        .select(`
          *,
          curriculum_items (
            title,
            activity_type,
            duration_minutes,
            kmap_dimensions
          )
        `)
        .eq('child_id', childId)
        .eq('execution_date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!activities || activities.length === 0) {
        return {
        date,
        activities: [],
        totalDuration: 0,
        completedCount: 0,
        kmapProgress: { move: 0, think: 0, endure: 0 }
      };
      }

      // Calculate aggregates
      const totalDuration = activities.reduce((sum, a) => 
        sum + (a.curriculum_items?.duration_minutes || 0), 0
      );
      
      const completedCount = activities.filter(a => 
        a.status === 'completed'
      ).length;

      // Calculate K-Map progress
      const kmapProgress = {
        move: 0,
        think: 0,
        endure: 0
      };

      activities.forEach(activity => {
        if (activity.status === 'completed' && activity.kmap_scores) {
          kmapProgress.move += activity.kmap_scores.move || 0;
          kmapProgress.think += activity.kmap_scores.think || 0;
          kmapProgress.endure += activity.kmap_scores.endure || 0;
        }
      });

      return {
        date,
        activities,
        totalDuration,
        completedCount,
        kmapProgress
      };
    } catch (err: any) {
      console.error('Error getting learning day:', err);
      setError(err.message);
      return {
        date,
        activities: [],
        totalDuration: 0,
        completedCount: 0,
        kmapProgress: { move: 0, think: 0, endure: 0 }
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add the getChildLearningWeek function with optimization
  const getChildLearningWeek = useCallback(async (
    childId: string, 
    weekStart: string
  ) => {
    const startDate = new Date(weekStart);
    const promises = [];
    
    // Use Promise.all for parallel execution instead of serial
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      promises.push(
        getChildLearningDay(childId, date.toISOString().split('T')[0])
          .then(data => ({
            date: date.toISOString().split('T')[0],
            data
          }))
      );
    }
    
    return Promise.all(promises);
  }, [getChildLearningDay]);

  const getChildLearningTrends = useCallback(async (
    childId: string,
    period: 'week' | 'month' | 'term'
  ): Promise<LearningTrends > => {

    // Add validation
    if (!childId || !period) {
      return {
        period: period || 'week',
        totalActivities: 0,
        completionRate: 0,
        averageQuality: 0,
        topDimension: 'move',
        improvementAreas: []
      };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      // Validate dates
      if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
        return {
          period,
          totalActivities: 0,
          completionRate: 0,
          averageQuality: 0,
          topDimension: 'move',
          improvementAreas: []
        };
      }

      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'term':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      const { data: activities, error } = await db.supabase
        .from('progress_tracking')
        .select('*')
        .eq('child_id', childId)
        .gte('execution_date', startDate.toISOString().split('T')[0])
        .lte('execution_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      if (!activities || activities.length === 0) {
        return {
        period,
        totalActivities: 0,
        completionRate: 0,
        averageQuality: 0,
        topDimension: 'move',
        improvementAreas: []
      };
      }

      // Calculate trends with safe division
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
      
      const totalQuality = activities.reduce((sum, a) => 
        sum + (a.quality_score || 0), 0
      );
      const qualityCount = activities.filter(a => a.quality_score).length;
      const averageQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;

      // Determine top dimension
      const dimensionTotals = { move: 0, think: 0, endure: 0 };
      activities.forEach(a => {
        if (a.kmap_scores) {
          dimensionTotals.move += a.kmap_scores.move || 0;
          dimensionTotals.think += a.kmap_scores.think || 0;
          dimensionTotals.endure += a.kmap_scores.endure || 0;
        }
      });

      const topDimension = Object.entries(dimensionTotals)
        .sort(([, a], [, b]) => b - a)[0][0];

      // Identify improvement areas
      const improvementAreas = [];
      if (completionRate < 70) improvementAreas.push('Activity completion');
      if (averageQuality < 3) improvementAreas.push('Engagement quality');
      
      // Check dimension balance
      const dimValues = Object.values(dimensionTotals);
      const maxDim = Math.max(...dimValues);
      const minDim = Math.min(...dimValues);
      if (maxDim > minDim * 2) improvementAreas.push('Balanced development');

      return {
        period,
        totalActivities,
        completionRate,
        averageQuality,
        topDimension,
        improvementAreas
      };
    } catch (err: any) {
      console.error('Error getting learning trends:', err);
      setError(err.message);
      return {
        period,
        totalActivities: 0,
        completionRate: 0,
        averageQuality: 0,
        topDimension: 'move',
        improvementAreas: []
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add worksheet linking functionality if needed
  const linkWorksheet = useCallback(async (
    progressId: string,
    worksheetData: {
      worksheetUrl: string;
      completionTime?: number;
      score?: number;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.supabase
        .from('progress_tracking')
        .update({
          worksheet_url: worksheetData.worksheetUrl,
          worksheet_completion_time: worksheetData.completionTime,
          worksheet_score: worksheetData.score,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err: any) {
      console.error('Error linking worksheet:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);


  // Track progress for entire class
  const trackClassProgress = useCallback(async (
    classId: string,
    curriculumItemId: string,
    progressData: ProgressData
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all enrolled children
      const { data: assignments } = await db.supabase
        .from('child_class_assignments')
        .select('child_id')
        .eq('class_id', classId)
        .eq('status', 'enrolled');

      if (!assignments || assignments.length === 0) {
        return { success: false, error: 'No children found in class' };
      }

      // Track progress for each child
      const results = await Promise.all(
        assignments.map(a => 
          trackProgress(a.child_id, curriculumItemId, progressData)
        )
      );

      return { 
        success: true, 
        data: { updated: results.filter(r => r.success).length }
      };
    } catch (err: any) {
      console.error('Error tracking class progress:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [trackProgress]);

  // Alias for trackInformalObservation

  // Track informal observation
  const trackInformalObservation = useCallback(async (
    childId: string,
    observation: {
      type: string;
      description: string;
      tags?: string[];
      parentVisible?: boolean;
      activityScheduleId?: string;  // Changed from activityId to match our usage
    }
  ) => {
    console.log('trackInformalObservation called with:', { childId, observation });
    try {
      setLoading(true);
      setError(null);
      
      // Add validation
      if (!childId) {
        return { success: false, error: 'Child ID is required', data: null };
      }
      
      // Get current user for teacher_id
      const { data: { user } } = await db.supabase.auth.getUser();
      
      // Use progress_tracking table instead of informal_observations
      const { data, error } = await db.supabase
        .from('progress_tracking')
        .insert({
          child_id: childId,
          execution_date: new Date().toISOString().split('T')[0],
          execution_type: 'individual',
          status: 'completed',
          teacher_id: user?.id || null,
          teacher_notes: `${observation.type}: ${observation.description}${observation.tags?.length ? ' | Tags: ' + observation.tags.join(', ') : ''}`,
          parent_visible: observation.parentVisible ?? true,
          quality_score: null,
          observation_type: observation.type,
          activity_schedule_id: observation.activityScheduleId || null,  // This will save the activity ID
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err: any) {
      console.error('Error recording observation:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for recordInformalObservation
  const recordInformalObservation = useCallback(async (
    childId: string,
    observation: string,
    tags?: string[]
  ) => {
    return trackInformalObservation(childId, {
      type: 'observation',
      description: observation,
  
      tags: tags || []
    });
  }, [trackInformalObservation]);

  // Add this method before the return statement
const getActivityObservations = useCallback(async (activityScheduleId: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error } = await db.supabase
      .from('progress_tracking')
      .select('*')
      .eq('activity_schedule_id', activityScheduleId)
      .not('teacher_notes', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching activity observations:', err);
    setError(err.message);
    return { success: false, data: [], error: err.message };
  } finally {
    setLoading(false);
  }
}, []);


// Update an existing observation
const updateObservation = useCallback(async (
  observationId: string,
  updates: {
    description?: string;
    tags?: string[];
    parentVisible?: boolean;
    observationType?: string;
  }
) => {
  try {
    setLoading(true);
    setError(null);
    
    // Rebuild teacher_notes if description or tags changed
    let teacherNotes = undefined;
    if (updates.description !== undefined || updates.tags !== undefined) {
      const type = updates.observationType || 'observation';
      const desc = updates.description || '';
      const tags = updates.tags || [];
      teacherNotes = `${type}: ${desc}${tags.length ? ' | Tags: ' + tags.join(', ') : ''}`;
    }
    
    const { data, error } = await db.supabase
      .from('progress_tracking')
      .update({
        teacher_notes: teacherNotes,
        parent_visible: updates.parentVisible,
        observation_type: updates.observationType,
        updated_at: new Date().toISOString()
      })
      .eq('id', observationId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Error updating observation:', err);
    setError(err.message);
    return { success: false, error: err.message };
  } finally {
    setLoading(false);
  }
}, []);

// Delete an observation
const deleteObservation = useCallback(async (observationId: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const { error } = await db.supabase
      .from('progress_tracking')
      .delete()
      .eq('id', observationId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting observation:', err);
    setError(err.message);
    return { success: false, error: err.message };
  } finally {
    setLoading(false);
  }
}, []);

// Get observations by context (for Progress tab)
// Get observations by context (for Progress tab)
const getObservationsByContext = useCallback(async (context: {
  level: 'activity' | 'class' | 'child';
  id: string;
  dateRange?: { start: string; end: string };
}) => {
  try {
    setLoading(true);
    setError(null);
    
    let query = db.supabase
      .from('progress_tracking')
      .select(`
        *,
        children (id, first_name, last_name),
        activity_schedule (
          id,
          curriculum_item_id,
          curriculum_items (title, activity_type)
        )
      `)
      .not('observation_type', 'is', null)
      .order('created_at', { ascending: false });
    
    // Apply filters based on context
    switch (context.level) {
      case 'activity':
        query = query.eq('activity_schedule_id', context.id);
        break;
        
      case 'class':
        // ✅ FIX: Get children enrolled in the class first
        const { data: enrollments, error: enrollmentError } = await db.supabase
          .from('child_class_assignments')
          .select('child_id')
          .eq('class_id', context.id)
          .eq('status', 'enrolled');
        
        if (enrollmentError) {
          console.error('Error fetching class enrollments:', enrollmentError);
          return { success: false, data: [], error: enrollmentError.message };
        }
        
        const childIds = enrollments?.map(e => e.child_id) || [];
        
        if (childIds.length === 0) {
          // No children in class, return empty array
          return { success: true, data: [] };
        }
        
        // Filter observations by children in the class
        query = query.in('child_id', childIds);
        break;
        
      case 'child':
        query = query.eq('child_id', context.id);
        break;
    }
    
    // Apply date range if provided
    if (context.dateRange) {
      query = query
        .gte('execution_date', context.dateRange.start)
        .lte('execution_date', context.dateRange.end);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Error getting observations by context:', err);
    setError(err.message);
    return { success: false, data: [], error: err.message };
  } finally {
    setLoading(false);
  }
}, []);



  return {
    loading,
    error,
    trackProgress,
    trackClassProgress,  // Add this
    trackInformalObservation,
    recordInformalObservation,
    recordObservation,
    getChildLearningDay,
    getChildLearningWeek,
    getChildLearningTrends,
    linkWorksheet,
    getActivityObservations,  // Add this line
    updateObservation,        // Add this
  deleteObservation,        // Add this
  getObservationsByContext  // Add this
  };
}