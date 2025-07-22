// hooks/use-progress.ts
import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

export function useProgress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordProgress = useCallback(async (progressData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.createProgress(progressData);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to record progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkRecordProgress = useCallback(async (
    classId: string,
    curriculumItemId: string,
    date: string,
    childIds: string[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.bulkCreateProgress(classId, curriculumItemId, date, childIds);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to record bulk progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildProgress = useCallback(async (
    childId: string,
    dateRange?: { start: string; end: string }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getProgressByChild(childId, dateRange);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getClassProgress = useCallback(async (classId: string, date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getProgressByClass(classId, date);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get class progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    recordProgress,
    bulkRecordProgress,
    getChildProgress,
    getClassProgress
  };
}