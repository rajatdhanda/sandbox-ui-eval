// hooks/use-curriculum-management.ts
// Path: hooks/use-curriculum-management.ts

import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface CurriculumTemplate {
  id: string;
  name: string;
  age_group: string;
  subject_area: string;
  difficulty_level: string;
  total_weeks: number;
  learning_objectives: string[];
}

interface CurriculumItem {
  id: string;
  title: string;
  activity_type: string;
  week_number: number;
  day_number: number;
  sequence_order: number;
  duration_minutes: number;
}

export function useCurriculumManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curriculumTemplates, setCurriculumTemplates] = useState<CurriculumTemplate[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Memoize user ID on mount
  useEffect(() => {
    db.supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);
  const loadCurriculum = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.supabase
        .from('curriculum_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCurriculumTemplates(data || []);
      return { success: true, data: data || [], error: null };
    } catch (err: any) {
      console.error('Error loading curriculum:', err);
      setError(err.message);
      return { success: false, error: err.message, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const assignCurriculum = useCallback(async (
    curriculumTemplateId: string,
    classId: string,
    startDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use memoized user ID
      
      // Check if assignment already exists
      const { data: existing } = await db.supabase
        .from('curriculum_assignments')
        .select('id')
        .eq('curriculum_template_id', curriculumTemplateId)
        .eq('class_id', classId)
        .eq('is_active', true)
        .maybeSingle();

      let assignmentId: string;

      if (existing) {
        // Update existing assignment
        const { data, error } = await db.supabase
          .from('curriculum_assignments')
          .update({
            start_date: startDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        assignmentId = data.id;
      } else {
        // Create new assignment with available fields only
        const { data, error } = await db.supabase
          .from('curriculum_assignments')
          .insert({
            curriculum_template_id: curriculumTemplateId,
            class_id: classId,
            start_date: startDate,
            assignment_type: 'class',
            assigned_by: currentUserId,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        assignmentId = data.id;
      }

      // Auto-generate activity schedules based on curriculum items
      const { data: curriculumItems } = await db.supabase
        .from('curriculum_items')
        .select('*')
        .eq('curriculum_template_id', curriculumTemplateId)
        .eq('is_active', true)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true })
        .order('sequence_order', { ascending: true });

      if (curriculumItems && curriculumItems.length > 0) {
        const schedules = [];
        const startDateObj = new Date(startDate);

        for (const item of curriculumItems) {
          // Calculate the actual date for this activity
          const activityDate = new Date(startDateObj);
          activityDate.setDate(startDateObj.getDate() + (item.week_number - 1) * 7 + (item.day_number - 1));
          
          // Skip weekends
          if (activityDate.getDay() === 0) activityDate.setDate(activityDate.getDate() + 1); // Sunday to Monday
          if (activityDate.getDay() === 6) activityDate.setDate(activityDate.getDate() + 2); // Saturday to Monday

          // Generate time slots with helper function
          const generateTimeSlot = (seq: number) => {
            const hour = 9 + Math.floor(seq / 2);
            const minute = seq % 2 === 0 ? '00' : '30';
            return `${hour.toString().padStart(2, '0')}:${minute}:00`;
          };

          schedules.push({
            class_id: classId,
            curriculum_item_id: item.id,
            scheduled_date: activityDate.toISOString().split('T')[0],
            scheduled_time: generateTimeSlot(item.sequence_order),
            end_time: generateTimeSlot(item.sequence_order + 1),
            status: 'scheduled',
            teacher_id: currentUserId
          });
        }

        // Insert schedules in batches
        const batchSize = 50;
        for (let i = 0; i < schedules.length; i += batchSize) {
          const batch = schedules.slice(i, i + batchSize);
          await db.supabase
            .from('activity_schedule')
            .insert(batch);
        }
      }

      return { success: true, data: { assignmentId }, error: null };
    } catch (err: any) {
      console.error('Error assigning curriculum:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const assignIndividualActivity = useCallback(async (
    childId: string,
    curriculumItemId: string,
    executionDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add this validation
      if (!childId || !curriculumItemId || !executionDate) {
        return { success: false, data: null, error: 'Missing required parameters: childId, curriculumItemId, or executionDate' };
      }
      
      const { data: { user } } = await db.supabase.auth.getUser();
      
      // First check if assignment already exists
      const { data: existing } = await db.supabase
        .from('progress_tracking')
        .select('id')
        .eq('child_id', childId)
        .eq('curriculum_item_id', curriculumItemId)
        .eq('execution_date', executionDate)
        .maybeSingle();
      
      if (existing) {
        // Update existing record
        const { data, error } = await db.supabase
          .from('progress_tracking')
          .update({
            status: 'scheduled',
            execution_type: 'individual',
            teacher_id: currentUserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, data, error: null };
      } else {
        // Create new assignment
        const { data, error } = await db.supabase
          .from('progress_tracking')
          .insert({
            child_id: childId,
            curriculum_item_id: curriculumItemId,
            execution_date: executionDate,
            execution_type: 'individual',
            status: 'scheduled',
            teacher_id: currentUserId,
            parent_visible: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, data, error: null };
      }
    } catch (err: any) {
      console.error('Error assigning individual activity:', err);
      setError(err.message);
      return { success: false, data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkAssignActivities = useCallback(async (
    childIds: string[],
    curriculumItemIds: string[],
    executionDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Add this validation
      if (!childIds?.length || !curriculumItemIds?.length || !executionDate) {
        return { success: false, data: null, error: 'Missing required parameters: childIds, curriculumItemIds, or executionDate' };
      }

      // Also validate that no IDs are empty strings
      if (childIds.some(id => !id) || curriculumItemIds.some(id => !id)) {
        return { success: false, data: null, error: 'Empty IDs provided' };
      }
      
      const { data: { user } } = await db.supabase.auth.getUser();
      const assignments = [];

      for (const childId of childIds) {
        for (const itemId of curriculumItemIds) {
          // Check if assignment exists
          const { data: existing } = await db.supabase
            .from('progress_tracking')
            .select('id')
            .eq('child_id', childId)
            .eq('curriculum_item_id', itemId)
            .eq('execution_date', executionDate)
            .maybeSingle();

          if (!existing) {
            assignments.push({
              child_id: childId,
              curriculum_item_id: itemId,
              execution_date: executionDate,
              execution_type: 'individual',
              status: 'scheduled',
              teacher_id: currentUserId,
              parent_visible: false
            });
          }
        }
      }

      if (assignments.length > 0) {
        const { data, error } = await db.supabase
          .from('progress_tracking')
          .insert(assignments)
          .select();

        if (error) throw error;
        return { success: true, data: { count: data.length }, error: null };
      }

      return { success: true, data: { count: 0 }, error: null };
    } catch (err: any) {
      console.error('Error bulk assigning activities:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivitySchedule = useCallback(async (
    classId: string,
    scheduledDate: string,
    activities: Array<{
      curriculum_item_id: string;
      scheduled_time: string;
      end_time: string;
    }>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await db.supabase.auth.getUser();
      
      const schedules = activities.map(activity => ({
        class_id: classId,
        curriculum_item_id: activity.curriculum_item_id,
        scheduled_date: scheduledDate,
        scheduled_time: activity.scheduled_time,
        end_time: activity.end_time,
        status: 'scheduled',
        teacher_id: user?.id
      }));

      const { data, error } = await db.supabase
        .from('activity_schedule')
        .insert(schedules)
        .select();

      if (error) throw error;

      return { success: true, data, error: null };
    } catch (err: any) {
      console.error('Error creating activity schedule:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableActivities = useCallback(async (
    classId: string,
    date: string
  ) => {
    try {
      // Simple query without age group filtering for now
      const { data, error } = await db.supabase
        .from('curriculum_items')
        .select('*')
        .eq('is_active', true)
        .order('sequence_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error getting available activities:', error);
      return [];
    }
  }, []);

  // CSV import functionality
  const importCurriculumFromCSV = useCallback(async (csvData: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Process CSV data and insert curriculum items
      const { data, error } = await db.supabase
        .from('curriculum_items')
        .insert(csvData)
        .select();

      if (error) throw error;

      return { success: true, data: { imported: data.length }, error: null };
    } catch (err: any) {
      console.error('Error importing curriculum:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add deactivate curriculum method
  const deactivateCurriculum = useCallback(async (
    assignmentId: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.supabase
        .from('curriculum_assignments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, error: null };
    } catch (err: any) {
      console.error('Error deactivating curriculum:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCurriculumTemplates = useCallback(async (
    filters?: {
      ageGroup?: string;
      subjectArea?: string;
      isActive?: boolean;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = db.supabase
        .from('curriculum_templates')
        .select('*');
      
      // Apply filters
      if (filters?.ageGroup) {
        query = query.eq('age_group', filters.ageGroup);
      }
      if (filters?.subjectArea) {
        query = query.eq('subject_area', filters.subjectArea);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      } else {
        // Default to active templates
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      setCurriculumTemplates(data || []);
      return { success: true, data: data || [], error: null };
    } catch (err: any) {
      console.error('Error loading curriculum templates:', err);
      setError(err.message);
      return { success: false, data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    curriculumTemplates,
    loadCurriculum,
    loadCurriculumTemplates,  // Add this
    assignCurriculum,
    deactivateCurriculum,
    assignIndividualActivity,
    bulkAssignActivities,
    createActivitySchedule,
    getAvailableActivities,
    importCurriculumFromCSV
  };
}