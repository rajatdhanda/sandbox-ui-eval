// lib/config/users-config.ts
// Path: lib/config/users-config.ts
// Centralized user configuration

import React from 'react';
import { colors } from '@/lib/styles';
import { Users, Shield, UserCheck } from 'lucide-react-native';

export const usersConfig = {
  // Default form data
  defaultUserData: {
    email: '',
    full_name: '',
    role: 'parent' as 'parent' | 'teacher' | 'admin',
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    is_active: true
  },

  // Validation rules
  userValidation: {
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneRegex: /^[\+]?[1-9][\d\s\-\(\)]{7,}$/,
    roles: ['parent', 'teacher', 'admin'] as const,
    errorMessages: {
      email: 'Please enter a valid email address',
      emailRequired: 'Email is required',
      fullName: 'Full name is required',
      role: 'Role is required',
      invalidRole: 'Role must be parent, teacher, or admin',
      phone: 'Please enter a valid phone number',
      duplicate: 'A user with this email already exists',
      foreignKey: 'Invalid selection. Please check and try again',
      nullValue: 'Please fill in all required fields',
      generic: 'Failed to save user. Please try again.'
    }
  },

  // Form field definitions  
  getUserFormFields() {
    return [
      {
        key: 'email',
        type: 'email' as const,
        label: 'Email Address',
        placeholder: 'user@example.com',
        required: true
      },
      {
        key: 'full_name',
        type: 'text' as const,
        label: 'Full Name',
        placeholder: 'Enter full name',
        required: true
      },
      {
        key: 'role',
        type: 'select' as const,
        label: 'Role',
        placeholder: 'Select role',
        required: true,
        options: [
          { value: 'parent', label: 'Parent' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'admin', label: 'Administrator' }
        ]
      },
      {
        key: 'phone',
        type: 'tel' as const,
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: false
      },
      {
        key: 'address',
        type: 'textarea' as const,
        label: 'Address',
        placeholder: 'Enter address',
        required: false
      },
      {
        key: 'emergency_contact',
        type: 'text' as const,
        label: 'Emergency Contact Name',
        placeholder: 'Contact name',
        required: false
      },
      {
        key: 'emergency_phone',
        type: 'tel' as const,
        label: 'Emergency Phone',
        placeholder: '+1 (555) 123-4567',
        required: false
      }
    ];
  },

  // Stats configuration
  getUserStats(users: any[]) {
    return [
      { 
        icon: () => React.createElement(Users, { size: 24, color: colors.primary }), 
        value: users.filter((u: any) => u.is_active).length, 
        label: 'Active Users' 
      },
      { 
        icon: () => React.createElement(Shield, { size: 24, color: colors.warning }), 
        value: users.filter((u: any) => u.role === 'admin').length, 
        label: 'Admins' 
      },
      { 
        icon: () => React.createElement(UserCheck, { size: 24, color: colors.success }), 
        value: users.filter((u: any) => u.role === 'teacher').length, 
        label: 'Teachers' 
      },
      { 
        icon: () => React.createElement(Users, { size: 24, color: colors.info }), 
        value: users.filter((u: any) => u.role === 'parent').length, 
        label: 'Parents' 
      }
    ];
  },

  // Role color mapping
  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return colors.error;
      case 'teacher': return colors.warning;
      case 'parent': return colors.success;
      default: return colors.gray500;
    }
  },

  // Validate user form data
  validateUser(data: any) {
    const errors: Record<string, string> = {};
    const { userValidation } = usersConfig;
    
    // Email validation
    if (!data.email?.trim()) {
      errors.email = userValidation.errorMessages.emailRequired;
    } else if (!userValidation.emailRegex.test(data.email)) {
      errors.email = userValidation.errorMessages.email;
    }
    
    // Full name validation
    if (!data.full_name?.trim()) {
      errors.full_name = userValidation.errorMessages.fullName;
    }
    
    // Role validation
    if (!data.role?.trim()) {
      errors.role = userValidation.errorMessages.role;
    } else if (!userValidation.roles.includes(data.role as any)) {
      errors.role = userValidation.errorMessages.invalidRole;
    }
    
    // Phone validation (optional)
    if (data.phone && !userValidation.phoneRegex.test(data.phone)) {
      errors.phone = userValidation.errorMessages.phone;
    }
    
    // Emergency phone validation (optional)
    if (data.emergency_phone && !userValidation.phoneRegex.test(data.emergency_phone)) {
      errors.emergency_phone = userValidation.errorMessages.phone;
    }
    
    return errors;
  },

  // Transform user data for editing
  transformUserForEdit(user: any) {
    // Remove any joined data or extra fields
    const cleanUser = { ...user };
    
    // Remove fields that aren't in the form
    delete cleanUser.created_at;
    delete cleanUser.updated_at;
    delete cleanUser.last_login;
    
    return {
      ...usersConfig.defaultUserData,
      ...cleanUser
    };
  }
};