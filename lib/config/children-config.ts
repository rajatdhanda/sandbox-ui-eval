// lib/config/children-config.ts
// Path: lib/config/children-config.ts
// Centralized children configuration

import { colors, getModuleColor } from '@/lib/styles';

export const childrenConfig = {
  // Default form data
  defaultChildData: {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    class_id: '',
    medical_notes: '',
    allergies: '',
    emergency_contact: '',
    emergency_phone: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    is_active: true
  },

  // Validation rules
  childValidation: {
    dateRegex: /^\d{4}-\d{2}-\d{2}$/,
    phoneRegex: /^[\+]?[1-9][\d\s\-\(\)]{7,}$/,
    minAge: 0,
    maxAge: 6,
    errorMessages: {
      firstName: 'First name is required',
      lastName: 'Last name is required',
      dateOfBirth: 'Date of birth is required',
      invalidDate: 'Date must be in YYYY-MM-DD format',
      invalidPhone: 'Please enter a valid phone number',
      ageLimit: 'Child must be between 0 and 6 years old',
      futureDate: 'Birth date cannot be in the future',
      enrollmentDate: 'Enrollment date is required',
      duplicate: 'A child with this name and birth date already exists',
      foreignKey: 'Invalid class selection. Please check and try again',
      nullValue: 'Please fill in all required fields',
      generic: 'Failed to save child. Please try again.'
    }
  },

  // Form field definitions
  getChildFormFields(classOptions: any[] = []) {
    // Convert entity options to select format if needed
    const formattedClassOptions = classOptions.map(cls => {
      // If it's already in the entity option format (from useEntityOptions)
      if (cls.id && cls.label) {
        return {
          value: cls.id,
          label: cls.subtitle ? `${cls.label} (${cls.subtitle})` : cls.label
        };
      }
      // Otherwise assume it's raw data from database
      return {
        value: cls.id,
        label: cls.name ? `${cls.name} (${cls.age_group || ''})` : 'Unknown Class'
      };
    });

    return [
      { 
        key: 'first_name', 
        label: 'First Name', 
        type: 'text' as const, 
        required: true, 
        placeholder: 'e.g., Emma' 
      },
      { 
        key: 'last_name', 
        label: 'Last Name', 
        type: 'text' as const, 
        required: true, 
        placeholder: 'e.g., Johnson' 
      },
      { 
        key: 'date_of_birth', 
        label: 'Date of Birth', 
        type: 'date' as const, 
        required: true, 
        placeholder: 'YYYY-MM-DD' 
      },
      { 
        key: 'class_id', 
        label: 'Class', 
        type: 'select' as const,
        required: false, 
        placeholder: 'Select a class',
        options: formattedClassOptions
      },
      { 
        key: 'medical_notes', 
        label: 'Medical Notes', 
        type: 'textarea' as const, 
        placeholder: 'Any medical conditions or notes' 
      },
      { 
        key: 'allergies', 
        label: 'Allergies', 
        type: 'textarea' as const, 
        placeholder: 'Food allergies, environmental allergies, etc.' 
      },
      { 
        key: 'emergency_contact', 
        label: 'Emergency Contact', 
        type: 'text' as const, 
        placeholder: 'Contact person name' 
      },
      { 
        key: 'emergency_phone', 
        label: 'Emergency Phone', 
        type: 'text' as const, 
        placeholder: '+1 (555) 123-4567' 
      },
      { 
        key: 'enrollment_date', 
        label: 'Enrollment Date', 
        type: 'date' as const, 
        required: true,
        placeholder: 'YYYY-MM-DD' 
      },
      { 
        key: 'is_active', 
        label: 'Active Status', 
        type: 'checkbox' as const, 
        placeholder: 'Student is currently enrolled' 
      }
    ];
  },

  // Helper functions
  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Get age group based on date of birth
  getAgeGroup(dateOfBirth: string): string {
    const age = this.calculateAge(dateOfBirth);
    
    if (age < 1) return '0-1 years';
    if (age < 2) return '1-2 years';
    if (age < 3) return '2-3 years';
    if (age < 4) return '3-4 years';
    if (age < 5) return '4-5 years';
    if (age < 6) return '5-6 years';
    return '6+ years';
  },

  // Format phone number for display
  formatPhone(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as US phone number if 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  },

  // Get health status color
  getHealthStatusColor(hasAllergies: boolean, hasMedicalNotes: boolean): string {
    if (hasAllergies && hasMedicalNotes) return colors.error;
    if (hasAllergies || hasMedicalNotes) return colors.warning;
    return colors.success;
  },

  // Get enrollment status
  getEnrollmentStatus(enrollmentDate: string, isActive: boolean): string {
    if (!isActive) return 'Inactive';
    
    const enrollment = new Date(enrollmentDate);
    const today = new Date();
    const daysSinceEnrollment = Math.floor((today.getTime() - enrollment.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceEnrollment < 30) return 'New';
    if (daysSinceEnrollment < 90) return 'Recent';
    return 'Established';
  }
};