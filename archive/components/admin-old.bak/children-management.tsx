// app/components/admin/children-management.tsx
// Path: app/components/admin/children-management.tsx

import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Alert } from 'react-native';
import { Baby, Calendar, AlertTriangle, Phone, School } from 'lucide-react-native';

import { commonStyles, colors } from '@/lib/styles';
import { useCrud } from '@/hooks/use-crud';
import { useEntityOptions } from '@/hooks/use-entity-options';
import { 
  CrudHeader, 
  CrudStats, 
  CrudFilters, 
  CrudList, 
  CrudCard, 
  CrudForm, 
  DetailRow, 
  StatusBadge 
} from '../shared/crud-components';
import { AutoForm } from '../shared/auto-form';
import { ConsoleLogger } from '../shared/console-logger';
import { ScrollableContainer } from '../shared/scrollable-container';
import { childrenConfig } from '@/lib/config/children-config';

// Default form data from config
const defaultFormData = childrenConfig.defaultChildData;

const validateChild = (data: any) => {
  console.log('🔍 [CHILDREN_MANAGEMENT] Validating form data:', data);
  const errors: Record<string, string> = {};
  const { childValidation } = childrenConfig;
  
  if (!data.first_name?.trim()) errors.first_name = childValidation.errorMessages.firstName;
  if (!data.last_name?.trim()) errors.last_name = childValidation.errorMessages.lastName;
  if (!data.date_of_birth?.trim()) errors.date_of_birth = childValidation.errorMessages.dateOfBirth;
  
  // Date format validation
  if (data.date_of_birth && !childValidation.dateRegex.test(data.date_of_birth)) {
    errors.date_of_birth = childValidation.errorMessages.invalidDate;
  }
  
  // Age validation
  if (data.date_of_birth && !errors.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    
    // Check if birth date is in future
    if (birthDate > today) {
      errors.date_of_birth = childValidation.errorMessages.futureDate;
    } else {
      const age = childrenConfig.calculateAge(data.date_of_birth);
      if (age < childValidation.minAge || age > childValidation.maxAge) {
        errors.date_of_birth = childValidation.errorMessages.ageLimit;
      }
    }
  }
  
  // Phone validation
  if (data.emergency_phone && !childValidation.phoneRegex.test(data.emergency_phone)) {
    errors.emergency_phone = childValidation.errorMessages.invalidPhone;
  }
  
  console.log('📋 [CHILDREN_MANAGEMENT] Validation errors:', errors);
  return errors;
};

export const ChildrenManagement = () => {
  const [showConsole, setShowConsole] = useState(false);
  
  console.log('🎯 [CHILDREN_MANAGEMENT] Component initializing...');
  
  // Load entity options for dropdowns
  const entityData = useEntityOptions({
    classes: true
  });
  
  // Log the structure to debug
  console.log('🔍 Entity data structure:', {
    loading: entityData.loading,
    loaded: entityData.loaded,
    classesRaw: entityData.rawData?.classes?.slice(0, 2),
    classesOptions: entityData.options?.classes?.slice(0, 2)
  });
  
  const crud = useCrud({
    tableName: 'children',
    moduleName: 'CHILDREN_MANAGEMENT',
    defaultFormData,
    validate: validateChild,
    // Join with classes to show class name and color
    selectQuery: `
      *,
      class:classes(id, name, age_group, color_code)
    `,
    transformForEdit: (item) => {
      // Create a clean copy without joined data
      const cleanItem = { ...item };
      delete cleanItem.class; // Remove the joined class data
      
      return {
        ...defaultFormData,
        ...cleanItem,
        // Ensure date format is correct
        date_of_birth: item.date_of_birth ? item.date_of_birth.substring(0, 10) : '',
        enrollment_date: item.enrollment_date ? item.enrollment_date.substring(0, 10) : new Date().toISOString().split('T')[0]
      };
    }
  });

  // Add extra logging for debugging
  console.log('📊 [CHILDREN_MANAGEMENT] Current items:', crud.items);
  console.log('🔄 [CHILDREN_MANAGEMENT] Loading state:', crud.loading);
  console.log('⚙️ [CHILDREN_MANAGEMENT] Action loading:', crud.actionLoading);

  // Enhanced submit with error handling
  const handleSubmit = async () => {
    try {
      console.log('💾 [CHILDREN_MANAGEMENT] Form submit initiated');
      console.log('📝 [CHILDREN_MANAGEMENT] Form data:', crud.formData);
      
      await crud.handleSubmit();
      
    } catch (error: any) {
      console.error('Submit error:', error);
      
      const { errorMessages } = childrenConfig.childValidation;
      let userMessage = errorMessages.generic;

      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          userMessage = errorMessages.duplicate;
        } else if (error.message.includes('violates foreign key')) {
          userMessage = errorMessages.foreignKey;
        } else if (error.message.includes('null value')) {
          userMessage = errorMessages.nullValue;
        } else if (error.message.includes("Could not find the 'class' column")) {
          userMessage = "Database schema mismatch. Please contact support.";
        }
      }
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${userMessage}`);
      } else {
        Alert.alert('Error', userMessage);
      }
    }
  };

  // Handle form field changes
  const handleFormChange = (key: string, value: any) => {
    console.log(`🔄 [CHILDREN_MANAGEMENT] Form field changed: ${key} = ${value}`);
    crud.setFormData({ ...crud.formData, [key]: value });
  };

  // Form fields from config - use options.classes from entityData
  const formFields = childrenConfig.getChildFormFields(entityData.options?.classes || []);
  
  // Calculate stats
  const stats = [
    { 
      icon: <Baby size={24} color={colors.primary} />, 
      value: crud.items.filter(c => c.is_active).length, 
      label: 'Active Students' 
    },
    { 
      icon: <School size={24} color={colors.success} />, 
      value: crud.items.filter(c => c.class_id).length, 
      label: 'Enrolled' 
    },
    { 
      icon: <AlertTriangle size={24} color={colors.warning} />, 
      value: crud.items.filter(c => c.allergies || c.medical_notes).length, 
      label: 'Special Needs' 
    },
    { 
      icon: <Calendar size={24} color={colors.info} />, 
      value: crud.items.length > 0 
        ? Math.round(crud.items.reduce((sum, c) => sum + childrenConfig.calculateAge(c.date_of_birth), 0) / crud.items.length) 
        : 0, 
      label: 'Avg Age' 
    }
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollableContainer
        headerComponent={(isCompact) => (
          <CrudHeader 
            title="Children Management" 
            subtitle="Manage student profiles and enrollment" 
            onAdd={() => crud.setShowForm(true)}
            onShowLogs={() => setShowConsole(true)}
            addButtonText="Add Student"
            compact={isCompact}
          />
        )}
        headerHeight={100}
        minHeaderHeight={60}
      >
        <CrudStats stats={stats} />

        <CrudFilters 
          searchTerm={crud.searchTerm} 
          onSearchChange={crud.setSearchTerm}
          onRefresh={() => {
            console.log('🔄 [CHILDREN_MANAGEMENT] Manual refresh triggered');
            crud.fetchItems();
          }} 
          loading={crud.loading} 
        />

        <CrudList
          loading={crud.loading}
          items={crud.items.filter(item => 
            item.first_name?.toLowerCase().includes(crud.searchTerm.toLowerCase()) ||
            item.last_name?.toLowerCase().includes(crud.searchTerm.toLowerCase()) ||
            item.class?.name?.toLowerCase().includes(crud.searchTerm.toLowerCase())
          )}
          emptyIcon={<Baby size={48} color={colors.gray300} />}
          emptyTitle="No students found"
          emptySubtitle="Add your first student to get started"
          renderItem={(item) => (
            <CrudCard
              key={item.id}
              item={item}
              title={`${item.first_name} ${item.last_name}`}
              subtitle={`Age ${childrenConfig.calculateAge(item.date_of_birth)} • ${item.class?.name || 'No Class'}`}
              onEdit={() => {
                console.log('✏️ [CHILDREN_MANAGEMENT] Edit button clicked for:', item.first_name, item.id);
                crud.handleEdit(item);
              }}
              onDelete={() => {
                console.log('🗑️ [CHILDREN_MANAGEMENT] Delete button clicked for:', item.first_name, item.id);
                crud.handleDelete(item);
              }}
              actionLoading={crud.actionLoading}
              colorBar={item.class?.color_code}
            >
              <DetailRow icon={<Calendar size={16} color={colors.textSecondary} />}>
                <Text>Born: {new Date(item.date_of_birth).toLocaleDateString()}</Text>
              </DetailRow>
              
              {item.class && (
                <DetailRow icon={<School size={16} color={colors.textSecondary} />}>
                  <Text>Class: {item.class.name} ({item.class.age_group})</Text>
                </DetailRow>
              )}
              
              {item.emergency_contact && (
                <DetailRow icon={<Phone size={16} color={colors.textSecondary} />}>
                  <Text>Emergency: {item.emergency_contact}</Text>
                  {item.emergency_phone && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {childrenConfig.formatPhone(item.emergency_phone)}
                    </Text>
                  )}
                </DetailRow>
              )}
              
              {(item.allergies || item.medical_notes) && (
                <DetailRow icon={<AlertTriangle size={16} color={colors.warning} />}>
                  <Text style={{ color: colors.warning }}>Has medical notes/allergies</Text>
                </DetailRow>
              )}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <StatusBadge isActive={item.is_active} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Enrolled: {new Date(item.enrollment_date).toLocaleDateString()}
                </Text>
              </View>
            </CrudCard>
          )}
        />
      </ScrollableContainer>

      <CrudForm
        visible={crud.showForm}
        title={crud.editingItem ? 'Edit Student' : 'Add Student'}
        onClose={() => {
          console.log('❌ [CHILDREN_MANAGEMENT] Form closed');
          crud.handleCloseForm();
        }}
        onSubmit={handleSubmit}
        loading={!!crud.actionLoading}
        submitText={crud.editingItem ? 'Update' : 'Create'}
      >
        <AutoForm
          fields={formFields}
          data={crud.formData}
          onChange={handleFormChange}
          errors={crud.formErrors}
        />
      </CrudForm>

      <ConsoleLogger visible={showConsole} onClose={() => setShowConsole(false)} />
    </SafeAreaView>
  );
};