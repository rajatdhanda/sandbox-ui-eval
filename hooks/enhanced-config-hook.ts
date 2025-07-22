// hooks/useConfigFields.ts - Enhanced Hook with Caching and Real-time Updates
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/supabase/services/database.service';
import { supabase } from '@/lib/supabase/clients';

interface ConfigOption {
  value: string;
  label: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface ConfigFieldsState {
  options: ConfigOption[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseConfigFieldsReturn extends ConfigFieldsState {
  refresh: () => Promise<void>;
  addOption: (option: Omit<ConfigOption, 'sort_order'>) => Promise<boolean>;
  updateOption: (value: string, updates: Partial<ConfigOption>) => Promise<boolean>;
  deleteOption: (value: string) => Promise<boolean>;
  reorderOptions: (reorderedOptions: ConfigOption[]) => Promise<boolean>;
}

// Cache for config fields
const configCache = new Map<string, {
  data: ConfigOption[];
  timestamp: number;
  expiry: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REAL_TIME_CHANNELS = new Map<string, any>();

export const useConfigFields = (category: string): UseConfigFieldsReturn => {
  const [state, setState] = useState<ConfigFieldsState>({
    options: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Check cache first
  const getCachedData = useCallback((category: string): ConfigOption[] | null => {
    const cached = configCache.get(category);
    if (cached && Date.now() < cached.expiry) {
      console.log(`📦 Using cached config for ${category}`);
      return cached.data;
    }
    return null;
  }, []);

  // Update cache
  const updateCache = useCallback((category: string, data: ConfigOption[]) => {
    configCache.set(category, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_DURATION
    });
  }, []);

  // Fetch config fields with enhanced error handling and retry logic
  const fetchConfigFields = useCallback(async (useCache = true) => {
    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check cache first
      if (useCache) {
        const cachedData = getCachedData(category);
        if (cachedData) {
          setState({
            options: cachedData,
            loading: false,
            error: null,
            lastUpdated: new Date()
          });
          return;
        }
      }

      console.log(`🔄 Fetching config fields for category: ${category}`);

      const result = await db.read('config_fields', {
        filters: { 
          category,
          is_active: true 
        },
        orderBy: [
          { column: 'sort_order', ascending: true },
          { column: 'label', ascending: true }
        ]
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch config fields');
      }

      const options: ConfigOption[] = (result.data || []).map(field => ({
        value: field.value,
        label: field.label,
        description: field.description,
        sort_order: field.sort_order,
        is_active: field.is_active
      }));

      // Update cache
      updateCache(category, options);

      setState({
        options,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      // Reset retry count on success
      retryCount.current = 0;

      console.log(`✅ Config fields loaded for ${category}:`, options.length);

    } catch (error: any) {
      console.error(`💥 Error fetching config fields for ${category}:`, error);

      // Retry logic
      if (retryCount.current < maxRetries && !abortController.current?.signal.aborted) {
        retryCount.current++;
        console.log(`🔄 Retrying... Attempt ${retryCount.current}/${maxRetries}`);
        setTimeout(() => fetchConfigFields(false), 1000 * retryCount.current);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load configuration options'
      }));
    }
  }, [category, getCachedData, updateCache]);

  // Add new option
  const addOption = useCallback(async (option: Omit<ConfigOption, 'sort_order'>): Promise<boolean> => {
    try {
      console.log(`🔄 Adding config option to ${category}:`, option);

      // Get current max sort order
      const maxSortOrder = Math.max(...state.options.map(opt => opt.sort_order), 0);

      const result = await db.create('config_fields', {
        category,
        label: option.label,
        value: option.value,
        description: option.description || null,
        is_active: option.is_active,
        sort_order: maxSortOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to add option');
      }

      // Refresh data
      await fetchConfigFields(false);
      return true;

    } catch (error: any) {
      console.error(`💥 Error adding config option:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [category, state.options, fetchConfigFields]);

  // Update option
  const updateOption = useCallback(async (value: string, updates: Partial<ConfigOption>): Promise<boolean> => {
    try {
      console.log(`🔄 Updating config option ${value} in ${category}:`, updates);

      const result = await db.update('config_fields', 
        {
          ...updates,
          updated_at: new Date().toISOString()
        },
        { 
          category,
          value 
        }
      );

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update option');
      }

      // Refresh data
      await fetchConfigFields(false);
      return true;

    } catch (error: any) {
      console.error(`💥 Error updating config option:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [category, fetchConfigFields]);

  // Delete option (soft delete)
  const deleteOption = useCallback(async (value: string): Promise<boolean> => {
    try {
      console.log(`🗑️ Deleting config option ${value} from ${category}`);

      const result = await db.delete('config_fields', 
        { 
          category,
          value 
        },
        { hard: false } // Soft delete
      );

      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete option');
      }

      // Refresh data
      await fetchConfigFields(false);
      return true;

    } catch (error: any) {
      console.error(`💥 Error deleting config option:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [category, fetchConfigFields]);

  // Reorder options
  const reorderOptions = useCallback(async (reorderedOptions: ConfigOption[]): Promise<boolean> => {
    try {
      console.log(`🔄 Reordering config options for ${category}`);

      // Update sort order for each option
      const updates = reorderedOptions.map((option, index) => 
        db.update('config_fields',
          { 
            sort_order: index + 1,
            updated_at: new Date().toISOString()
          },
          { 
            category,
            value: option.value 
          }
        )
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);

      if (hasError) {
        throw new Error('Failed to reorder some options');
      }

      // Refresh data
      await fetchConfigFields(false);
      return true;

    } catch (error: any) {
      console.error(`💥 Error reordering config options:`, error);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [category, fetchConfigFields]);

  // Set up real-time subscription
  useEffect(() => {
    const channelKey = `config_fields_${category}`;
    
    // Check if channel already exists
    if (REAL_TIME_CHANNELS.has(channelKey)) {
      return;
    }

    console.log(`🔄 Setting up real-time subscription for ${category}`);

    const channel = supabase
      .channel(`config_fields_${category}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'config_fields',
          filter: `category=eq.${category}`
        },
        (payload) => {
          console.log(`📡 Real-time update for ${category}:`, payload);
          
          // Invalidate cache
          configCache.delete(category);
          
          // Refresh data
          fetchConfigFields(false);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${category}:`, status);
      });

    REAL_TIME_CHANNELS.set(channelKey, channel);

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up subscription for ${category}`);
      channel.unsubscribe();
      REAL_TIME_CHANNELS.delete(channelKey);
    };
  }, [category, fetchConfigFields]);

  // Initial fetch
  useEffect(() => {
    fetchConfigFields(true);

    // Cleanup abort controller
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchConfigFields]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchConfigFields(false);
  }, [fetchConfigFields]);

  return {
    ...state,
    refresh,
    addOption,
    updateOption,
    deleteOption,
    reorderOptions
  };
};

// Enhanced version with multiple categories
export const useMultipleConfigFields = (categories: string[]) => {
  const [state, setState] = useState<Record<string, ConfigFieldsState>>({});

  const results = categories.reduce((acc, category) => {
    acc[category] = useConfigFields(category);
    return acc;
  }, {} as Record<string, UseConfigFieldsReturn>);

  // Aggregate loading state
  const isAnyLoading = Object.values(results).some(result => result.loading);
  const hasAnyError = Object.values(results).some(result => result.error);

  return {
    results,
    isAnyLoading,
    hasAnyError,
    refreshAll: async () => {
      await Promise.all(Object.values(results).map(result => result.refresh()));
    }
  };
};

// Utility function to clear all cache
export const clearConfigCache = () => {
  console.log('🧹 Clearing config fields cache');
  configCache.clear();
};

// Utility function to preload config fields
export const preloadConfigFields = async (categories: string[]) => {
  console.log('📦 Preloading config fields:', categories);
  
  const promises = categories.map(async (category) => {
    try {
      const result = await db.read('config_fields', {
        filters: { category, is_active: true },
        orderBy: [{ column: 'sort_order', ascending: true }]
      });

      if (result.data) {
        const options: ConfigOption[] = result.data.map(field => ({
          value: field.value,
          label: field.label,
          description: field.description,
          sort_order: field.sort_order,
          is_active: field.is_active
        }));

        configCache.set(category, {
          data: options,
          timestamp: Date.now(),
          expiry: Date.now() + CACHE_DURATION
        });
      }
    } catch (error) {
      console.error(`Failed to preload ${category}:`, error);
    }
  });

  await Promise.all(promises);
  console.log('✅ Config fields preloaded');
};