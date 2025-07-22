// app/components/admin/user-management.tsx
// Path: app/components/admin/user-management.tsx

import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Alert } from 'react-native';
import { Users, Shield, Phone, Mail, UserCheck, UserX } from 'lucide-react-native';
import { commonStyles, colors } from '@/lib/styles';
import { useCrud } from '@/hooks/use-crud';
import { CrudHeader, CrudStats, CrudFilters, CrudList, CrudCard, CrudForm, DetailRow, StatusBadge } from '../shared/crud-components';
import { AutoForm } from '../shared/auto-form';
import { ConsoleLogger } from '../shared/console-logger';
import { ScrollableContainer } from '../shared/scrollable-container';

const defaultFormData = {
  email: '',
  full_name: '',
  role: 'parent',
  phone: '',
  address: '',
  emergency_contact: '',
  emergency_phone: '',
  is_active: true
};

const formFields = [
  { key: 'full_name', label: 'Full Name', type: 'text' as const, required: true, placeholder: 'e.g., John Smith' },
  { key: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'john@example.com' },
  { 
    key: 'role', 
    label: 'Role', 
    type: 'select' as const, 
    required: true, 
    placeholder: 'Select role',
    options: [
      { value: 'parent', label: 'Parent' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'admin', label: 'Administrator' }
    ]
  },
  { key: 'phone', label: 'Phone', type: 'tel' as const, placeholder: '+1 (555) 123-4567' },
  { key: 'address', label: 'Address', type: 'textarea' as const, placeholder: '123 Main St, City, State' },
  { key: 'emergency_contact', label: 'Emergency Contact', type: 'text' as const, placeholder: 'Jane Smith' },
  { key: 'emergency_phone', label: 'Emergency Phone', type: 'tel' as const, placeholder: '+1 (555) 987-6543' },
  { key: 'is_active', label: 'Active Status', type: 'checkbox' as const, placeholder: 'User is active' }
];

const validateUser = (data: any) => {
  console.log('🔍 [USER_MANAGEMENT] Validating form data:', data);
  const errors: Record<string, string> = {};
  
  if (!data.full_name?.trim()) errors.full_name = 'Full name is required';
  if (!data.email?.trim()) errors.email = 'Email is required';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }
  if (!data.role?.trim()) errors.role = 'Role is required';
  if (!['parent', 'teacher', 'admin'].includes(data.role)) {
    errors.role = 'Role must be parent, teacher, or admin';
  }
  
  console.log('📋 [USER_MANAGEMENT] Validation errors:', errors);
  return errors;
};

export const UserManagement = () => {
  const [showConsole, setShowConsole] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  
  console.log('🎯 [USER_MANAGEMENT] Component initializing...');
  
  const crud = useCrud({
    tableName: 'users',
    moduleName: 'USER_MANAGEMENT',
    defaultFormData,
    validate: validateUser,
    selectQuery: '*',
    transformForEdit: (item) => {
      // Create a clean copy without extra fields
      const cleanItem = { ...item };
      // Remove fields that aren't in our form
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      delete cleanItem.last_login;
      
      return {
        ...defaultFormData,
        ...cleanItem
      };
    }
  });

  // Add extra logging for debugging
  console.log('📊 [USER_MANAGEMENT] Current items:', crud.items);
  console.log('🔄 [USER_MANAGEMENT] Loading state:', crud.loading);
  console.log('⚙️ [USER_MANAGEMENT] Action loading:', crud.actionLoading);

  const stats = [
    { icon: <Users size={24} color={colors.primary} />, value: crud.items.filter(u => u.is_active).length, label: 'Active Users' },
    { icon: <Shield size={24} color={colors.warning} />, value: crud.items.filter(u => u.role === 'admin').length, label: 'Admins' },
    { icon: <UserCheck size={24} color={colors.success} />, value: crud.items.filter(u => u.role === 'teacher').length, label: 'Teachers' },
    { icon: <UserX size={24} color={colors.info} />, value: crud.items.filter(u => u.role === 'parent').length, label: 'Parents' }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.error;
      case 'teacher': return colors.success;
      case 'parent': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={16} color={getRoleColor(role)} />;
      case 'teacher': return <UserCheck size={16} color={getRoleColor(role)} />;
      case 'parent': return <Users size={16} color={getRoleColor(role)} />;
      default: return <Users size={16} color={getRoleColor(role)} />;
    }
  };

  return (
    <>
      <ScrollableContainer
        headerComponent={(isCompact) => (
          <CrudHeader 
            title="User Management" 
            subtitle="Manage parents, teachers, and admins" 
            onAdd={() => crud.setShowForm(true)}
            onShowLogs={() => setShowConsole(true)}
            addButtonText="Add User"
            compact={isCompact}
          />
        )}
        headerHeight={100}
        minHeaderHeight={60}
      >
        <View style={{ backgroundColor: colors.background || '#FFFFFF' }}>
          <CrudStats stats={stats} />
          
          <CrudFilters 
            searchTerm={crud.searchTerm} 
            onSearchChange={crud.setSearchTerm}
            filterButtons={[
              { key: 'all', label: 'All Users', isActive: filter === 'all' },
              { key: 'admin', label: 'Admins', isActive: filter === 'admin' },
              { key: 'teacher', label: 'Teachers', isActive: filter === 'teacher' },
              { key: 'parent', label: 'Parents', isActive: filter === 'parent' },
              { key: 'active', label: 'Active', isActive: filter === 'active' }
            ]}
            onFilterChange={setFilter}
            onRefresh={() => {
              console.log('🔄 [USER_MANAGEMENT] Manual refresh triggered');
              crud.fetchItems();
            }} 
            loading={crud.loading} 
          />

          <CrudList
            loading={crud.loading}
            items={crud.items.filter(item => {
              // Search filter
              const matchesSearch = !crud.searchTerm || 
                item.full_name?.toLowerCase().includes(crud.searchTerm.toLowerCase()) ||
                item.email?.toLowerCase().includes(crud.searchTerm.toLowerCase()) ||
                item.role?.toLowerCase().includes(crud.searchTerm.toLowerCase());
              
              // Role/status filter
              let matchesFilter = true;
              if (filter && filter !== 'all') {
                if (filter === 'active') {
                  matchesFilter = item.is_active;
                } else if (filter === 'admin' || filter === 'teacher' || filter === 'parent') {
                  matchesFilter = item.role === filter;
                }
              }
              
              return matchesSearch && matchesFilter;
            })}
            emptyIcon={<Users size={48} color={colors.gray300} />}
            emptyTitle="No users found"
            emptySubtitle="Add your first user to get started"
            renderItem={(item) => (
              <CrudCard
                key={item.id}
                item={item}
                title={item.full_name}
                subtitle={item.email}
                onEdit={() => {
                  console.log('✏️ [USER_MANAGEMENT] Edit button clicked for:', item.full_name, item.id);
                  crud.handleEdit(item);
                }}
                  onDelete={() => {
                    console.log('🗑️ [USER_MANAGEMENT] Delete button clicked for:', item.full_name, item.id);
                    crud.handleDelete(item);
                  }}
                actionLoading={crud.actionLoading}
                colorBar={getRoleColor(item.role)}
              >
                <DetailRow icon={getRoleIcon(item.role)}>
                  <Text style={{ color: getRoleColor(item.role), fontWeight: '600' }}>
                    {item.role.toUpperCase()}
                  </Text>
                </DetailRow>
                {item.phone && (
                  <DetailRow icon={<Phone size={16} color={colors.textSecondary} />}>
                    <Text>{item.phone}</Text>
                  </DetailRow>
                )}
                <DetailRow icon={<Mail size={16} color={colors.textSecondary} />}>
                  <Text>{item.email}</Text>
                </DetailRow>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <StatusBadge isActive={item.is_active} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </CrudCard>
            )}
          />
        </View>
      </ScrollableContainer>

      <CrudForm
        visible={crud.showForm}
        title={crud.editingItem ? 'Edit User' : 'Add User'}
        onClose={() => {
          console.log('❌ [USER_MANAGEMENT] Form closed');
          crud.handleCloseForm();
        }}
        onSubmit={async () => {
          console.log('💾 [USER_MANAGEMENT] Form submit initiated');
          console.log('📝 [USER_MANAGEMENT] Form data:', crud.formData);
          
          try {
            await crud.handleSubmit();
          } catch (error: any) {
            console.error('Submit error:', error);
            
            let userMessage = 'Failed to save user. Please try again.';
            
            if (error?.message) {
              if (error.message.includes('duplicate key')) {
                userMessage = 'A user with this email already exists.';
              } else if (error.message.includes('violates foreign key')) {
                userMessage = 'Invalid selection. Please check and try again.';
              } else if (error.message.includes('null value')) {
                userMessage = 'Please fill in all required fields.';
              }
            }
            
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`Error: ${userMessage}`);
            } else {
              Alert.alert('Error', userMessage);
            }
          }
        }}
        loading={!!crud.actionLoading}
        submitText={crud.editingItem ? 'Update' : 'Create'}
      >
        <AutoForm
          fields={formFields}
          data={crud.formData}
          onChange={(key, value) => {
            console.log(`🔄 [USER_MANAGEMENT] Form field changed: ${key} = ${value}`);
            crud.setFormData({ ...crud.formData, [key]: value });
          }}
          errors={crud.formErrors}
        />
      </CrudForm>

      <ConsoleLogger visible={showConsole} onClose={() => setShowConsole(false)} />
    </>
  );
};