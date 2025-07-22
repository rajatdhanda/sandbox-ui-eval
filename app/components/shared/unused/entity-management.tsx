// components/shared/entity-management.tsx
// Template for creating new management components

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, RefreshCw, Activity } from 'lucide-react-native';

// Import centralized systems
import { theme } from '@/lib/styles';
import { 
  validateSchema, 
  fieldDefinitions,
  defaultValues,
  type User, // Replace with your entity type
  userFormSchema, // Replace with your schema
} from '@/lib/schemas';
import { logger, logUserAction, startTimer } from '@/lib/utils/logger';
import { enhancedDb } from '@/lib/supabase/services/database-service-with-logging';


const { commonStyles, colors } = theme;

interface EntityManagementProps {
  entityName: string; // 'users', 'classes', etc.
  entityLabel: string; // 'User', 'Class', etc.
  entityService: any; // Service class
  schema: any; // Validation schema
  fieldDefs: any; // Field definitions
  defaultVals: any; // Default values
}

export const EntityManagement: React.FC<EntityManagementProps> = ({
  entityName,
  entityLabel,
  entityService,
  schema,
  fieldDefs,
  defaultVals,
}) => {
  const MODULE_NAME = `${entityName.toUpperCase()}_MANAGEMENT`;
  
  // State management
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any | null>(null);
  const [formData, setFormData] = useState(defaultVals);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Component lifecycle
  useEffect(() => {
    logger.componentMount(MODULE_NAME);
    fetchEntities();
    return () => logger.componentUnmount(MODULE_NAME);
  }, []);

  // Data fetching
  const fetchEntities = async () => {
    const timer = startTimer(MODULE_NAME, 'FETCH_ENTITIES');
    setLoading(true);
    
    try {
      logUserAction(MODULE_NAME, 'FETCH_INITIATED', { searchTerm, filters });
      
      const result = await entityService.getAll();
      
      if (result.error) {
        logger.error(MODULE_NAME, 'FETCH_ERROR', result.error);
        Alert.alert('Error', `Failed to fetch ${entityName}`);
        return;
      }

      let data = result.data || [];
      
      // Apply client-side filtering
      if (searchTerm) {
        data = data.filter((item: any) => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      setEntities(data);
      logUserAction(MODULE_NAME, 'FETCH_SUCCESS', { count: data.length });
      
    } catch (error) {
      logger.error(MODULE_NAME, 'FETCH_UNEXPECTED_ERROR', error);
      Alert.alert('Error', `Unexpected error fetching ${entityName}`);
    } finally {
      setLoading(false);
      timer();
    }
  };

  // Form validation
  const validateForm = () => {
    const validation = validateSchema(schema, formData);
    if (validation.success) {
      setFormErrors({});
      return true;
    } else {
      setFormErrors(validation.errors || {});
      return false;
    }
  };

  // CRUD operations
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const timer = startTimer(MODULE_NAME, editingEntity ? 'UPDATE' : 'CREATE');
    setActionLoading(editingEntity ? 'update' : 'create');
    
    try {
      const operation = editingEntity ? 'update' : 'create';
      logUserAction(MODULE_NAME, `${operation.toUpperCase()}_INITIATED`, {
        entityId: editingEntity?.id,
        formData
      });

      const result = editingEntity 
        ? await entityService.update(editingEntity.id, formData)
        : await entityService.create(formData);
      
      if (result.error) {
        logger.error(MODULE_NAME, `${operation.toUpperCase()}_FAILED`, result.error);
        Alert.alert('Error', `Failed to ${operation} ${entityLabel.toLowerCase()}`);
        return;
      }
      
      logger.info(MODULE_NAME, `${operation.toUpperCase()}_SUCCESS`);
      Alert.alert('Success', `${entityLabel} ${operation}d successfully!`);
      logUserAction(MODULE_NAME, `${operation.toUpperCase()}_SUCCESS`);
      
      handleCloseForm();
      fetchEntities();
      
    } catch (error) {
      logger.error(MODULE_NAME, 'SUBMIT_UNEXPECTED_ERROR', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setActionLoading(null);
      timer();
    }
  };

  const handleEdit = (entity: any) => {
    logger.debug(MODULE_NAME, 'EDIT_INITIATED', { entityId: entity.id });
    setEditingEntity(entity);
    setFormData(entity);
    setShowForm(true);
  };

  const handleDelete = (entity: any) => {
    Alert.alert(
      `Delete ${entityLabel}`,
      `Are you sure you want to delete this ${entityLabel.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const timer = startTimer(MODULE_NAME, 'DELETE');
            setActionLoading(`delete-${entity.id}`);
            
            try {
              const result = await entityService.delete(entity.id);
              
              if (result.error) {
                logger.error(MODULE_NAME, 'DELETE_FAILED', result.error);
                Alert.alert('Error', `Failed to delete ${entityLabel.toLowerCase()}`);
                return;
              }
              
              logger.info(MODULE_NAME, 'DELETE_SUCCESS');
              Alert.alert('Success', `${entityLabel} deleted successfully!`);
              fetchEntities();
              
            } catch (error) {
              logger.error(MODULE_NAME, 'DELETE_UNEXPECTED_ERROR', error);
              Alert.alert('Error', 'Failed to delete');
            } finally {
              setActionLoading(null);
              timer();
            }
          }
        }
      ]
    );
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEntity(null);
    setFormData(defaultVals);
    setFormErrors({});
  };

  const showDebugLogs = () => {
    const logs = logger.getLogs();
    const recentLogs = logs.slice(-50);
    Alert.alert(
      'Debug Logs',
      `Last ${recentLogs.length} entries:\n\n${recentLogs.map(log => 
        `[${log.level}] ${log.module}: ${log.action}`
      ).join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container as any}>
      {/* Header */}
      <View style={commonStyles.header as any}>
        <View>
          <Text style={commonStyles.headerTitle as any}>{entityLabel} Management</Text>
          <Text style={commonStyles.headerSubtitle as any}>Manage {entityName} with comprehensive logging</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={showDebugLogs} style={debugButtonStyle}>
            <Activity size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={commonStyles.buttonPrimary as any}
            onPress={() => setShowForm(true)}
          >
            <Plus size={20} color={colors.white} />
            <Text style={commonStyles.buttonText as any}>Add {entityLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <StatsOverview entities={entities} />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={fetchEntities}
        loading={loading}
      />

      {/* Entity List */}
      <ScrollView style={commonStyles.scrollContainer as any}>
        {loading ? (
          <View style={commonStyles.loadingContainer as any}>
            <RefreshCw size={24} color={colors.primary} />
            <Text style={commonStyles.loadingText as any}>Loading {entityName}...</Text>
          </View>
        ) : entities.length === 0 ? (
          <View style={commonStyles.emptyContainer as any}>
            <Text style={commonStyles.emptyTitle as any}>No {entityName} found</Text>
            <Text style={commonStyles.emptySubtitle as any}>
              Try adjusting your search criteria or add a new {entityLabel.toLowerCase()}.
            </Text>
          </View>
        ) : (
          entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              onEdit={() => handleEdit(entity)}
              onDelete={() => handleDelete(entity)}
              actionLoading={actionLoading}
              fieldDefinitions={fieldDefs}
            />
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={handleCloseForm}
      >
        <SafeAreaView style={commonStyles.modalContainer as any}>
          <View style={commonStyles.modalHeader as any}>
            <Text style={commonStyles.modalTitle as any}>
              {editingEntity ? `Edit ${entityLabel}` : `Add New ${entityLabel}`}
            </Text>
            <TouchableOpacity onPress={handleCloseForm}>
              <Text>✕</Text>
            </TouchableOpacity>
          </View>
          
          <DynamicForm
            fieldDefinitions={fieldDefs}
            formData={formData}
            onFormDataChange={setFormData}
            errors={formErrors}
          />

          <View style={commonStyles.modalFooter as any}>
            <TouchableOpacity
              style={commonStyles.buttonSecondary as any}
              onPress={handleCloseForm}
            >
              <Text style={commonStyles.buttonTextSecondary as any}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={commonStyles.buttonPrimary as any}
              onPress={handleSubmit}
              disabled={!!actionLoading}
            >
              <Text style={commonStyles.buttonText as any}>
                {editingEntity ? `Update ${entityLabel}` : `Create ${entityLabel}`}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const debugButtonStyle = {
  padding: 8,
  backgroundColor: colors.gray100,
  borderRadius: 6,
};

export default EntityManagement;