// hooks/use-crud.ts
// Path: hooks/use-crud.ts

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { db } from '@/lib/supabase/services/database.service';
import { logger, logUserAction, startTimer } from '@/lib/utils/logger';

interface UseCrudOptions<T> {
  tableName: string;
  moduleName: string;
  defaultFormData: T;
  validate?: (data: T) => Record<string, string>;
  transform?: (data: any) => any;
  transformForEdit?: (item: any) => any;  // ADD THIS LINE
  selectQuery?: string;
  filters?: Record<string, any>;
}

export function useCrud<T extends Record<string, any>>({
  tableName,
  moduleName,
  defaultFormData,
  validate,
  transform,
  transformForEdit,  // ADD THIS LINE
  selectQuery = '*',
  filters: defaultFilters = {}
}: UseCrudOptions<T>) {
  
  // State
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(defaultFilters);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<T>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // MAIN FETCH FUNCTION - Keep original name for compatibility
  const fetchItems = useCallback(async () => {
    const timer = startTimer(moduleName, 'FETCH_ITEMS');
    setLoading(true);
    
    try {
      logUserAction(moduleName, 'FETCH_INITIATED', { searchTerm, filters });
      
      console.log(`🔍 [${moduleName}] Fetching from ${tableName} with query: ${selectQuery}`);
      
      const result = await db.read(tableName as any, {
        select: selectQuery,
        filters: { is_active: true, ...filters },
        orderBy: [{ column: 'created_at', ascending: false }]
      });

      if (result.error) {
        logger.error(moduleName, 'FETCH_ERROR', result.error);
        console.error(`❌ [${moduleName}] Fetch error:`, result.error);
        Alert.alert('Error', `Failed to fetch ${tableName}: ${result.error.message || 'Unknown error'}`);
        setItems([]);
        return;
      }

      let data = result.data || [];
      
      // Apply client-side search
      if (searchTerm.trim()) {
        data = data.filter((item: any) => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      // Apply transform if provided
      if (transform) {
        data = data.map(transform);
      }

      console.log(`✅ [${moduleName}] Fetched ${data.length} items`);
      setItems(data);
      logUserAction(moduleName, 'FETCH_SUCCESS', { count: data.length });
      
    } catch (error) {
      logger.error(moduleName, 'FETCH_UNEXPECTED_ERROR', error);
      console.error(`💥 [${moduleName}] Unexpected fetch error:`, error);
      Alert.alert('Error', `Unexpected error fetching ${tableName}`);
      setItems([]);
    } finally {
      setLoading(false);
      timer();
    }
  }, [tableName, moduleName, selectQuery, filters, searchTerm, transform]);

  // Component lifecycle
  useEffect(() => {
    logger.componentMount(moduleName);
    fetchItems();
    return () => logger.componentUnmount(moduleName);
  }, []);

  // Search and filter effect
  useEffect(() => {
    logger.debug(moduleName, 'FILTERS_CHANGED', { searchTerm, filters });
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, fetchItems]);

  // Validate form
  const validateForm = () => {
    if (!validate) return true;
    
    const errors = validate(formData);
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    
    logger.info(moduleName, 'FORM_VALIDATION', { isValid, errorCount: Object.keys(errors).length });
    return isValid;
  };

  // Submit (create or update)
  const handleSubmit = async () => {
    console.log(`🚀 [${moduleName}] Submit initiated`);
    
    if (!validateForm()) {
      console.log(`❌ [${moduleName}] Validation failed`);
      return;
    }

    const timer = startTimer(moduleName, editingItem ? 'UPDATE' : 'CREATE');
    setActionLoading(editingItem ? 'update' : 'create');
    
    try {
      logUserAction(moduleName, `${editingItem ? 'UPDATE' : 'CREATE'}_INITIATED`, {
        itemId: editingItem?.id,
        formData
      });

      // Clean the data before sending to Supabase
      const submitData = { ...formData };
      
      // Remove empty UUID fields to let Supabase auto-generate them
      Object.keys(submitData).forEach(key => {
        const value = submitData[key];
        
        // Remove empty strings, null, undefined for UUID fields
        if (value === '' || value === null || value === undefined) {
          delete submitData[key];
        }
        
        // Specifically handle common UUID field patterns
        if (key.endsWith('_id') && (!value || value.trim() === '')) {
          delete submitData[key];
        }
        
        // Handle the main 'id' field for new records
        if (key === 'id' && !editingItem && (!value || value.trim() === '' || value.length < 36)) {
          delete submitData[key];
        }
      });

      // Add timestamps
      if (editingItem) {
        submitData.updated_at = new Date().toISOString();
      } else {
        submitData.created_at = new Date().toISOString();
        submitData.is_active = true;
      }

      console.log(`📝 [${moduleName}] Submitting cleaned data:`, submitData);

      const result = editingItem 
        ? await db.update(tableName as any, submitData, { id: editingItem.id })
        : await db.create(tableName as any, submitData);
      
      if (result.error) {
        logger.error(moduleName, `${editingItem ? 'UPDATE' : 'CREATE'}_FAILED`, result.error);
        console.error(`❌ [${moduleName}] Submit failed:`, result.error);
        
        const errorMsg = result.error.message || `Failed to ${editingItem ? 'update' : 'create'} ${tableName.slice(0, -1)}`;
        Alert.alert('Error', errorMsg);
        return;
      }
      
      logger.info(moduleName, `${editingItem ? 'UPDATE' : 'CREATE'}_SUCCESS`);
      console.log(`✅ [${moduleName}] Submit successful`);
      
      Alert.alert('Success', `${tableName.slice(0, -1)} ${editingItem ? 'updated' : 'created'} successfully!`);
      
      handleCloseForm();
      fetchItems(); // Call fetchItems to maintain compatibility
      
    } catch (error) {
      logger.error(moduleName, 'SUBMIT_UNEXPECTED_ERROR', error);
      console.error(`💥 [${moduleName}] Submit unexpected error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(null);
      timer();
    }
  };

  // Edit
  const handleEdit = (item: any) => {
  console.log(`✏️ [${moduleName}] Edit initiated for:`, item.id);
  logger.debug(moduleName, 'EDIT_INITIATED', { itemId: item.id });
  setEditingItem(item);
  
  // Apply transform if provided, otherwise use item as-is
  const editData = transformForEdit ? transformForEdit(item) : item;
  setFormData(editData);
  setShowForm(true);
};

  // Delete - IMPROVED with soft delete
  const handleDelete = (item: any) => {
  console.log(`🗑️ [${moduleName}] Delete requested for:`, item.id);
  logUserAction(moduleName, 'DELETE_INITIATED', { itemId: item.id });
  
  // For web/development, use window.confirm instead of Alert
  if (typeof window !== 'undefined' && window.confirm) {
    const confirmed = window.confirm(
      `Delete ${tableName.slice(0, -1)} - Are you sure you want to delete this item? This action cannot be undone.`
    );
    
    if (confirmed) {
      performDelete(item);
    } else {
      console.log(`🚫 [${moduleName}] Delete cancelled`);
      logger.debug(moduleName, 'DELETE_CANCELLED', { itemId: item.id });
    }
  } else {
    // Fallback to React Native Alert
    Alert.alert(
      `Delete ${tableName.slice(0, -1)}`,
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log(`🚫 [${moduleName}] Delete cancelled`);
            logger.debug(moduleName, 'DELETE_CANCELLED', { itemId: item.id });
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(item)
        }
      ]
    );
  }
};

  // Perform the actual delete operation - ENHANCED VERSION
  // In hooks/use-crud.ts, find the performDelete function and replace it with:
const performDelete = async (item: any) => {
  const timer = startTimer(moduleName, 'DELETE');
  setActionLoading(`delete-${item.id}`);
  
  try {
    console.log(`🔥 [${moduleName}] Performing delete for:`, item.id);
    console.log(`🔥 [${moduleName}] Target table: ${tableName}`);
    logUserAction(moduleName, 'DELETE_CONFIRMED', { itemId: item.id });
    
    // Check if table has is_active column
    const hasIsActive = 'is_active' in item;
    
    if (hasIsActive) {
      // Try soft delete first (safer for production)
      console.log(`🔄 [${moduleName}] Attempting soft delete...`);
      const result = await db.delete(tableName as any, { id: item.id }, { hard: false });
      
      console.log(`📊 [${moduleName}] Soft delete result:`, result);
      
      // Check if soft delete succeeded
      if (!result.error && result.data) {
        logger.info(moduleName, 'DELETE_SUCCESS', { itemId: item.id });
        console.log(`✅ [${moduleName}] Soft delete successful`);
        Alert.alert('Success', 'Item deleted successfully!');
        fetchItems(); // Refresh the list
        return;
      }
      
      // If soft delete failed, log the error
      if (result.error) {
        console.log(`⚠️ [${moduleName}] Soft delete failed:`, result.error);
      }
    }
    
    // Try hard delete if no is_active column or soft delete failed
    console.log(`💣 [${moduleName}] Attempting hard delete...`);
    const hardResult = await db.delete(tableName as any, { id: item.id }, { hard: true });
    console.log(`📊 [${moduleName}] Hard delete result:`, hardResult);
    
    if (hardResult.error) {
      logger.error(moduleName, 'DELETE_FAILED', hardResult.error);
      console.error(`❌ [${moduleName}] Hard delete failed:`, hardResult.error);
      
      // Better error messages
      let errorMsg = 'Failed to delete item';
      if (hardResult.error.message?.includes('foreign key')) {
        errorMsg = 'Cannot delete: This item is being used by other records';
      } else if (hardResult.error.message?.includes('permission')) {
        errorMsg = 'Permission denied: You cannot delete this item';
      } else if (hardResult.error.message) {
        errorMsg = hardResult.error.message;
      }
      
      Alert.alert('Delete Failed', errorMsg);
      return;
    }
    
    // Hard delete succeeded
    logger.info(moduleName, 'DELETE_SUCCESS', { itemId: item.id });
    console.log(`✅ [${moduleName}] Delete successful`);
    Alert.alert('Success', 'Item deleted successfully!');
    fetchItems(); // Refresh the list
    
  } catch (error) {
    logger.error(moduleName, 'DELETE_UNEXPECTED_ERROR', error);
    console.error(`💥 [${moduleName}] Delete unexpected error:`, error);
    Alert.alert('Error', 'Failed to delete item due to an unexpected error');
  } finally {
    setActionLoading(null);
    timer();
  }
};

  // Close form
  const handleCloseForm = () => {
    console.log(`🚪 [${moduleName}] Form closed`);
    setShowForm(false);
    setEditingItem(null);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  return {
    // State
    items,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    showForm,
    setShowForm,
    editingItem,
    formData,
    setFormData,
    formErrors,
    actionLoading,
    
    // Actions - KEEP ALL ORIGINAL METHOD NAMES
    fetchItems, // Main method name used by existing components
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCloseForm,
    
    // Utilities
    validateForm,
  };
}