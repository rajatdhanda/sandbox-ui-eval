// hooks/use-relationships.ts
import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

export function useRelationships() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignChildToClass = useCallback(async (childId: string, classId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.assignChildToClass(childId, classId);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to assign child to class');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTeacherToClass = useCallback(async (
    teacherId: string, 
    classId: string, 
    isPrimary: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.assignTeacherToClass(teacherId, classId, isPrimary);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to assign teacher to class');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignParentToChild = useCallback(async (
    parentId: string, 
    childId: string,
    relationshipType: string = 'parent',
    isPrimary: boolean = true
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.assignParentToChild(parentId, childId, relationshipType, isPrimary);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to assign parent to child');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getClassWithAllData = useCallback(async (classId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getClassWithRelationships(classId);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get class data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildWithAllData = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.getChildWithRelationships(childId);
      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get child data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    assignChildToClass,
    assignTeacherToClass,
    assignParentToChild,
    getClassWithAllData,
    getChildWithAllData
  };
}