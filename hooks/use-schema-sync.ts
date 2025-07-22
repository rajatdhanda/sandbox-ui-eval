// hooks/use-schema-sync.ts
import { useEffect, useState } from 'react';
import { db } from '@/lib/supabase/services/database.service';

export function useSchemaSync() {
  const [isOutOfSync, setIsOutOfSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check schema sync status on mount
    checkSyncStatus();
    
    // Set up periodic check (every 5 minutes)
    const interval = setInterval(checkSyncStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSyncStatus = async () => {
    try {
      // Check if database service can auto-sync
      if (typeof window === 'undefined') {
        const hasChanges = await db.autoSyncSchema();
        setIsOutOfSync(hasChanges);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.warn('Schema sync check failed:', error);
    }
  };

  const forceSync = async () => {
    try {
      const hasChanges = await db.autoSyncSchema();
      setIsOutOfSync(false);
      setLastSyncTime(new Date());
      
      if (hasChanges) {
        // Notify user to reload
        alert('Schema updated! Please reload the page.');
      }
      
      return hasChanges;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  };

  return {
    isOutOfSync,
    lastSyncTime,
    checkSyncStatus,
    forceSync
  };
}