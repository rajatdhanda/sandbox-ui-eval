// lib/schemas/index.ts
import { z } from 'zod';

// ========================= BASE SCHEMAS =========================

// Common fields used across entities
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_active: z.boolean().default(true),
});

// ========================= CORE ENTITY SCHEMAS =========================

// Users Schema
export const userSchema = baseEntitySchema.extend({
  email: z.string().email('Invalid email format'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['parent', 'teacher', 'admin'], {
    errorMap: () => ({ message: 'Role must be parent, teacher, or admin' })
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

// Children Schema
export const childSchema = baseEntitySchema.extend({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 0 && age <= 18;
  }, 'Invalid birth date'),
  class_id: z.string().uuid().optional(),
  medical_notes: z.string().optional(),
  allergies: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  pickup_authorized_users: z.array(z.string()).optional(),
  enrollment_date: z.string().optional(),
});

// Classes Schema
export const classSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Class name is required'),
  age_group: z.string().min(1, 'Age group is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(50, 'Capacity cannot exceed 50'),
  schedule_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  schedule_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  description: z.string().optional(),
  color_code: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
});

// ========================= FORM SCHEMAS =========================

// User form validation
export const userFormSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const userUpdateSchema = userFormSchema.partial();

// Child form validation
export const childFormSchema = childSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const childUpdateSchema = childFormSchema.partial();

// Class form validation
export const classFormSchema = classSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).refine((data) => {
  if (data.schedule_start && data.schedule_end) {
    const start = new Date(`2000-01-01T${data.schedule_start}`);
    const end = new Date(`2000-01-01T${data.schedule_end}`);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['schedule_end'],
});

export const classUpdateSchema = classFormSchema.partial();

// ========================= TYPE DEFINITIONS =========================

// Infer types from schemas
export type User = z.infer<typeof userSchema>;
export type UserForm = z.infer<typeof userFormSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type Child = z.infer<typeof childSchema>;
export type ChildForm = z.infer<typeof childFormSchema>;
export type ChildUpdate = z.infer<typeof childUpdateSchema>;

export type Class = z.infer<typeof classSchema>;
export type ClassForm = z.infer<typeof classFormSchema>;
export type ClassUpdate = z.infer<typeof classUpdateSchema>;

// Extended types with relationships
export type UserWithRelations = User & {
  children?: Child[];
  classes?: Class[];
  student_count?: number;
  class_count?: number;
};

export type ChildWithRelations = Child & {
  class?: Class;
  parents?: User[];
  attendance_count?: number;
  photos_count?: number;
};

export type ClassWithRelations = Class & {
  students?: Child[];
  teachers?: User[];
  student_count?: number;
  teacher_count?: number;
  primary_teacher?: User;
};

// ========================= VALIDATION HELPERS =========================

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// ========================= FIELD DEFINITIONS =========================

export const fieldDefinitions = {
  user: {
    email: {
      type: 'email',
      label: 'Email Address',
      placeholder: 'Enter email address',
      required: true,
    },
    full_name: {
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter full name',
      required: true,
    },
    role: {
      type: 'select',
      label: 'Role',
      placeholder: 'Select role',
      required: true,
      options: [
        { value: 'parent', label: 'Parent' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'admin', label: 'Administrator' },
      ],
    },
    phone: {
      type: 'tel',
      label: 'Phone Number',
      placeholder: 'Enter phone number',
      required: false,
    },
    address: {
      type: 'textarea',
      label: 'Address',
      placeholder: 'Enter address',
      required: false,
    },
    emergency_contact: {
      type: 'text',
      label: 'Emergency Contact',
      placeholder: 'Enter emergency contact name',
      required: false,
    },
    emergency_phone: {
      type: 'tel',
      label: 'Emergency Phone',
      placeholder: 'Enter emergency phone number',
      required: false,
    },
  },
  child: {
    first_name: {
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter first name',
      required: true,
    },
    last_name: {
      type: 'text',
      label: 'Last Name',
      placeholder: 'Enter last name',
      required: true,
    },
    date_of_birth: {
      type: 'date',
      label: 'Date of Birth',
      placeholder: 'Select date of birth',
      required: true,
    },
    class_id: {
      type: 'select',
      label: 'Class',
      placeholder: 'Select class',
      required: false,
      async: true, // Will be populated from API
    },
    medical_notes: {
      type: 'textarea',
      label: 'Medical Notes',
      placeholder: 'Enter any medical information',
      required: false,
    },
    allergies: {
      type: 'textarea',
      label: 'Allergies',
      placeholder: 'Enter any allergies',
      required: false,
    },
    emergency_contact: {
      type: 'text',
      label: 'Emergency Contact',
      placeholder: 'Enter emergency contact name',
      required: false,
    },
    emergency_phone: {
      type: 'tel',
      label: 'Emergency Phone',
      placeholder: 'Enter emergency phone number',
      required: false,
    },
  },
  class: {
    name: {
      type: 'text',
      label: 'Class Name',
      placeholder: 'e.g., Toddlers A',
      required: true,
    },
    age_group: {
      type: 'text',
      label: 'Age Group',
      placeholder: 'e.g., 2-3 years',
      required: true,
    },
    capacity: {
      type: 'number',
      label: 'Capacity',
      placeholder: '20',
      required: true,
      min: 1,
      max: 50,
    },
    schedule_start: {
      type: 'time',
      label: 'Start Time',
      placeholder: '09:00',
      required: true,
    },
    schedule_end: {
      type: 'time',
      label: 'End Time',
      placeholder: '15:00',
      required: true,
    },
    description: {
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description of the class program',
      required: false,
    },
    color_code: {
      type: 'color',
      label: 'Class Color',
      required: true,
      options: [
        { value: '#8B5CF6', label: 'Purple' },
        { value: '#EC4899', label: 'Pink' },
        { value: '#10B981', label: 'Green' },
        { value: '#F59E0B', label: 'Amber' },
        { value: '#3B82F6', label: 'Blue' },
        { value: '#EF4444', label: 'Red' },
      ],
    },
  },
};

// ========================= CONSTANTS =========================

export const constants = {
  roles: ['parent', 'teacher', 'admin'] as const,
  maxCapacity: 50,
  minCapacity: 1,
  colorOptions: [
    '#8B5CF6', '#EC4899', '#10B981', 
    '#F59E0B', '#3B82F6', '#EF4444'
  ],
  timeRegex: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  phoneRegex: /^[\+]?[1-9][\d]{0,15}$/,
};

// ========================= ERROR MESSAGES =========================

export const errorMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  time: 'Please enter a valid time (HH:MM)',
  color: 'Please enter a valid color code',
  capacity: 'Capacity must be between 1 and 50',
  timeRange: 'End time must be after start time',
  age: 'Please enter a valid age',
  generic: 'Please check your input and try again',
};

// ========================= UTILITY FUNCTIONS =========================

export const utils = {
  formatTime: (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return time;
    }
  },

  calculateAge: (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  getUtilizationColor: (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 75) return '#F59E0B';
    return '#10B981';
  },

  getUtilizationPercentage: (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  },

  generateId: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};

// ========================= DEFAULT VALUES =========================

export const defaultValues = {
  user: {
    email: '',
    full_name: '',
    role: 'parent' as const,
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    is_active: true,
  },
  child: {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    class_id: '',
    medical_notes: '',
    allergies: '',
    emergency_contact: '',
    emergency_phone: '',
    pickup_authorized_users: [],
    enrollment_date: new Date().toISOString().split('T')[0],
    is_active: true,
  },
  class: {
    name: '',
    age_group: '',
    capacity: 20,
    schedule_start: '09:00',
    schedule_end: '15:00',
    description: '',
    color_code: '#8B5CF6',
    is_active: true,
  },
};

// Export everything
export {
  userSchema,
  childSchema,
  classSchema,
  userFormSchema,
  childFormSchema,
  classFormSchema,
  userUpdateSchema,
  childUpdateSchema,
  classUpdateSchema,
};