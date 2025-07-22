// hooks/use-progress-tracking.ts
import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

export function useProgressTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProgressRecord = useCallback(async (data: {
    child_id: string;
    curriculum_item_id: string;
    class_id?: string;
    execution_date: string;
    execution_type: 'class' | 'individual';
    status: 'scheduled' | 'completed' | 'partial' | 'skipped' | 'absent';
    quality_score?: number;
    engagement_level?: 'low' | 'medium' | 'high';
    teacher_notes?: string;
    kmap_scores?: { move: number; think: number; endure: number };
    parent_visible?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.progress.createProgress(data);
      
      if (result.error) throw result.error;
      
      return { success: true, data: result.data };
    } catch (err: any) {
      setError(err.message || 'Failed to create progress');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkCreateProgress = useCallback(async (
    records: Array<{
      child_id: string;
      curriculum_item_id: string;
      execution_date: string;
      status: 'scheduled' | 'completed' | 'partial' | 'absent';
      [key: string]: any;
    }>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.progress.bulkCreateProgress(records);
      
      if (result.error) throw result.error;
      
      return { success: true, data: result.data };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk create progress');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (
    progressId: string,
    updates: {
      status?: string;
      quality_score?: number;
      engagement_level?: string;
      teacher_notes?: string;
      kmap_scores?: any;
      duration_minutes?: number;
    }
  ) => {
    try {
      const result = await db.progress.updateProgress(progressId, updates);
      
      if (result.error) throw result.error;
      
      return { success: true, data: result.data };
    } catch (err: any) {
      console.error('Error updating progress:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getChildProgress = useCallback(async (
    childId: string,
    dateRange?: { start: string; end: string }
  ) => {
    try {
      const result = await db.progress.getProgressByChild(childId, dateRange);
      
      if (result.error) throw result.error;
      
      return result.data || [];
    } catch (err: any) {
      console.error('Error getting child progress:', err);
      return [];
    }
  }, []);

  const getClassProgress = useCallback(async (
    classId: string,
    date: string
  ) => {
    try {
      const { data, error } = await db.supabase
        .from('progress_tracking')
        .select(`
          *,
          children!inner(id, first_name, last_name),
          curriculum_items!inner(title, activity_type)
        `)
        .eq('class_id', classId)
        .eq('execution_date', date);
      
      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Error getting class progress:', err);
      return [];
    }
  }, []);

  const generateProgressSummary = useCallback(async (
    childId: string,
    periodType: 'weekly' | 'monthly' | 'quarterly',
    startDate: string,
    endDate: string
  ) => {
    try {
      const result = await db.progress.generateProgressSummary(
        childId,
        periodType,
        startDate,
        endDate
      );
      
      if (result.error) throw result.error;
      
      return { success: true, data: result.data };
    } catch (err: any) {
      console.error('Error generating summary:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    loading,
    error,
    createProgressRecord,
    bulkCreateProgress,
    updateProgress,
    getChildProgress,
    getClassProgress,
    generateProgressSummary
  };
}