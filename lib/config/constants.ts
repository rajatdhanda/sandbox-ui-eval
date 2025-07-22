// app/lib/config/constants.ts
// Global constants to prevent hardcoding

export const APP_CONFIG = {
  // App info
  APP_NAME: 'Little Learners',
  APP_VERSION: '1.0.0',
  
  // Defaults
  DEFAULT_CLASS_CAPACITY: 20,
  DEFAULT_ACTIVITY_DURATION: 30, // minutes
  DEFAULT_PAGE_SIZE: 20,
  
  // Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CHILDREN_PER_CLASS: 30,
  MIN_PASSWORD_LENGTH: 8,
  
  // Time
  BUSINESS_HOURS: {
    OPEN: '07:00',
    CLOSE: '18:00',
  },
  
  // K-Map
  KMAP_DIMENSIONS: ['move', 'think', 'endure'] as const,
  KMAP_MAX_SCORE: 10,
  KMAP_MIN_SCORE: 0,
  
  // UI
  TOAST_DURATION: 3000, // ms
  DEBOUNCE_DELAY: 300, // ms
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    TEACHER_DASHBOARD: '/teacher/dashboard',
    PARENT_DASHBOARD: '/parent/dashboard',
    ADMIN_DASHBOARD: '/admin/dashboard',
  },
} as const;

// Status options (use these instead of hardcoding)
export const STATUS_OPTIONS = {
  ATTENDANCE: [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' },
  ],
  
  PROGRESS: [
    { value: 'completed', label: 'Completed' },
    { value: 'partial', label: 'Partial' },
    { value: 'skipped', label: 'Skipped' },
  ],
  
  ENGAGEMENT: [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ],
} as const;

// Error messages (consistent across app)
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully!',
  DELETED: 'Deleted successfully!',
  UPLOADED: 'File uploaded successfully!',
  ENROLLED: 'Enrollment successful!',
  ATTENDANCE_MARKED: 'Attendance marked successfully!',
} as const;