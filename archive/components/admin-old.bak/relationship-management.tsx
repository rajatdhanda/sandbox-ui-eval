// app/components/admin/relationship-management.tsx
// Path: app/components/admin/relationship-management.tsx

import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { Users, Baby, Link, UserPlus, Heart } from 'lucide-react-native';
import { ScrollableContainer } from '../shared/scrollable-container';
import { commonStyles, colors } from '@/lib/styles';
import { useCrud } from '@/hooks/use-crud';
import { CrudHeader, CrudStats, CrudFilters, CrudList, CrudCard, CrudForm, DetailRow, StatusBadge } from '../shared/crud-components';
import { AutoForm } from '../shared/auto-form';
import { ConsoleLogger } from '../shared/console-logger';

const defaultFormData = {
  parent_id: '',
  child_id: '',
  relationship_type: 'parent',
  is_primary: false
};

const formFields = [
  { key: 'parent_id', label: 'Parent ID', type: 'text' as const, required: true, placeholder: 'Select or enter parent ID' },
  { key: 'child_id', label: 'Child ID', type: 'text' as const, required: true, placeholder: 'Select or enter child ID' },
  { key: 'relationship_type', label: 'Relationship Type', type: 'text' as const, required: true, placeholder: 'parent, guardian, emergency' },
  { key: 'is_primary', label: 'Primary Contact', type: 'checkbox' as const, placeholder: 'Is primary contact for child' }
];

const validateRelationship = (data: any) => {
  console.log('🔍 [RELATIONSHIP_MANAGEMENT] Validating form data:', data);
  const errors: Record<string, string> = {};
  
  if (!data.parent_id?.trim()) errors.parent_id = 'Parent ID is required';
  if (!data.child_id?.trim()) errors.child_id = 'Child ID is required';
  if (!data.relationship_type?.trim()) errors.relationship_type = 'Relationship type is required';
  
  console.log('📋 [RELATIONSHIP_MANAGEMENT] Validation errors:', errors);
  return errors;
};

export const RelationshipManagement = () => {
  const [showConsole, setShowConsole] = useState(false);
  
  console.log('🎯 [RELATIONSHIP_MANAGEMENT] Component initializing...');
  
  const crud = useCrud({
    tableName: 'parent_child_relationships',
    moduleName: 'RELATIONSHIP_MANAGEMENT',
    defaultFormData,
    validate: validateRelationship,
    // Join with users and children to show names instead of IDs
    selectQuery: `
      *,
      parent:users!parent_id(id, full_name, email),
      child:children!child_id(id, first_name, last_name)
    `
  });

  // Add extra logging for debugging
  console.log('📊 [RELATIONSHIP_MANAGEMENT] Current items:', crud.items);
  console.log('🔄 [RELATIONSHIP_MANAGEMENT] Loading state:', crud.loading);
  console.log('⚙️ [RELATIONSHIP_MANAGEMENT] Action loading:', crud.actionLoading);

  const stats = [
    { icon: <Link size={24} color={colors.primary} />, value: crud.items.length, label: 'Total Relationships' },
    { icon: <Heart size={24} color={colors.error} />, value: crud.items.filter(r => r.is_primary).length, label: 'Primary Contacts' },
    { icon: <Users size={24} color={colors.success} />, value: crud.items.filter(r => r.relationship_type === 'parent').length, label: 'Parent Links' },
    { icon: <UserPlus size={24} color={colors.warning} />, value: crud.items.filter(r => r.relationship_type === 'guardian').length, label: 'Guardian Links' }
  ];

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'parent': return colors.success;
      case 'guardian': return colors.warning;
      case 'emergency': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'parent': return <Users size={16} color={getRelationshipColor(type)} />;
      case 'guardian': return <UserPlus size={16} color={getRelationshipColor(type)} />;
      case 'emergency': return <Heart size={16} color={getRelationshipColor(type)} />;
      default: return <Link size={16} color={getRelationshipColor(type)} />;
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeContainer}>
      <ScrollableContainer
        headerComponent={(isCompact) => (
          <CrudHeader
            title="Relationship Management"
            subtitle="Manage parent-child connections"
            onAdd={() => crud.setShowForm(true)}
            onShowLogs={() => setShowConsole(true)}
            addButtonText="Add Relationship"
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
            console.log('🔄 [RELATIONSHIP_MANAGEMENT] Manual refresh triggered');
            crud.fetchItems();
          }} 
          loading={crud.loading} 
        />

        <CrudList
          loading={crud.loading}
          items={crud.items}
          emptyIcon={<Link size={48} color={colors.gray300} />}
          emptyTitle="No relationships found"
          emptySubtitle="Create relationships between parents and children"
          renderItem={(item) => (
            <CrudCard
              key={item.id}
              item={item}
              title={`${item.parent?.full_name || 'Unknown Parent'} → ${item.child?.first_name || 'Unknown'} ${item.child?.last_name || 'Child'}`}
              subtitle={`${item.relationship_type} relationship`}
              onEdit={() => {
                console.log('✏️ [RELATIONSHIP_MANAGEMENT] Edit button clicked for:', item.id);
                crud.handleEdit(item);
              }}
              onDelete={() => {
                console.log('🗑️ [RELATIONSHIP_MANAGEMENT] Delete button clicked for:', item.id);
                crud.handleDelete(item);
              }}
              actionLoading={crud.actionLoading}
            >
              <DetailRow icon={getRelationshipIcon(item.relationship_type)}>
                <Text style={{ color: getRelationshipColor(item.relationship_type), fontWeight: '600' }}>
                  {item.relationship_type.toUpperCase()}
                </Text>
              </DetailRow>
              
              <DetailRow icon={<Users size={16} color={colors.textSecondary} />}>
                <Text>Parent: {item.parent?.full_name || item.parent_id}</Text>
              </DetailRow>
              
              <DetailRow icon={<Baby size={16} color={colors.textSecondary} />}>
                <Text>Child: {item.child?.first_name} {item.child?.last_name || item.child_id}</Text>
              </DetailRow>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <StatusBadge 
                  isActive={item.is_primary} 
                  activeText="Primary"
                  inactiveText="Secondary"
                />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </CrudCard>
          )}
        />

        <CrudForm
          visible={crud.showForm}
          title={crud.editingItem ? 'Edit Relationship' : 'Add Relationship'}
          onClose={() => {
            console.log('❌ [RELATIONSHIP_MANAGEMENT] Form closed');
            crud.handleCloseForm();
          }}
          onSubmit={() => {
            console.log('💾 [RELATIONSHIP_MANAGEMENT] Form submit initiated');
            console.log('📝 [RELATIONSHIP_MANAGEMENT] Form data:', crud.formData);
            crud.handleSubmit();
          }}
          loading={!!crud.actionLoading}
          submitText={crud.editingItem ? 'Update' : 'Create'}
        >
          <AutoForm
            fields={formFields}
            data={crud.formData}
            onChange={(key, value) => {
              console.log(`🔄 [RELATIONSHIP_MANAGEMENT] Form field changed: ${key} = ${value}`);
              crud.setFormData({ ...crud.formData, [key]: value });
            }}
            errors={crud.formErrors}
          />
        </CrudForm>
      </ScrollableContainer>
      
      {showConsole && (
        <ConsoleLogger
          visible={showConsole}
          onClose={() => setShowConsole(false)}
          logs={crud.logs}
        />
      )}
    </SafeAreaView>
  );
};