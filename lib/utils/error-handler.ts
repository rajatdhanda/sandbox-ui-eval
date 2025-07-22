// app/lib/utils/error-handler.ts
// Path: app/lib/utils/error-handler.ts
// Centralized error handling with user-friendly messages

import { Alert, Platform } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  context?: any;
}

// Common error patterns and their user-friendly messages
const errorPatterns = [
  {
    pattern: /duplicate key|unique constraint/i,
    userMessage: 'This item already exists. Please use a different name or identifier.',
    code: 'DUPLICATE_ENTRY'
  },
  {
    pattern: /foreign key|violates foreign key/i,
    userMessage: 'Invalid reference. Please check your selections and try again.',
    code: 'INVALID_REFERENCE'
  },
  {
    pattern: /null value|not-null constraint/i,
    userMessage: 'Please fill in all required fields.',
    code: 'MISSING_REQUIRED'
  },
  {
    pattern: /permission denied|unauthorized/i,
    userMessage: 'You don\'t have permission to perform this action.',
    code: 'UNAUTHORIZED'
  },
  {
    pattern: /network|fetch|connection/i,
    userMessage: 'Connection error. Please check your internet and try again.',
    code: 'NETWORK_ERROR'
  },
  {
    pattern: /timeout/i,
    userMessage: 'The request took too long. Please try again.',
    code: 'TIMEOUT'
  },
  {
    pattern: /schedule_type|column .* does not exist/i,
    userMessage: 'There was an issue with the data format. Please refresh and try again.',
    code: 'SCHEMA_MISMATCH'
  },
  {
    pattern: /invalid.*format|type error/i,
    userMessage: 'Invalid data format. Please check your input.',
    code: 'INVALID_FORMAT'
  }
];

export class ErrorHandler {
  // Parse error and return user-friendly message
  static parseError(error: any): AppError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Check against known patterns
    for (const pattern of errorPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        return {
          code: pattern.code,
          message: errorMessage,
          userMessage: pattern.userMessage,
          severity: 'error'
        };
      }
    }
    
    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'error'
    };
  }
  
  // Show error to user
  static showError(error: any, title: string = 'Error') {
    const appError = this.parseError(error);
    
    // Log to console for debugging
    console.error(`[${appError.code}] ${title}:`, error);
    
    // Show to user
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}: ${appError.userMessage}`);
    } else {
      Alert.alert(title, appError.userMessage);
    }
  }
  
  // Show success message
  static showSuccess(message: string, title: string = 'Success') {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  }
  
  // Show confirmation dialog
  static async confirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      return window.confirm(`${title}: ${message}`);
    } else {
      return new Promise((resolve) => {
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'OK', onPress: () => resolve(true) }
          ]
        );
      });
    }
  }
  
  // Log error for system health monitoring
  static logError(error: any, context: any = {}) {
    const appError = this.parseError(error);
    
    // In a real app, this would send to a logging service
    const errorLog = {
      timestamp: new Date().toISOString(),
      ...appError,
      context,
      platform: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined
    };
    
    console.error('[Error Log]', errorLog);
    
    // Store in local storage for health check
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push(errorLog);
        // Keep only last 100 errors
        if (errors.length > 100) errors.shift();
        localStorage.setItem('app_errors', JSON.stringify(errors));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }
  
  // Get recent errors for health check
  static getRecentErrors(): any[] {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('app_errors') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  // Clear error logs
  static clearErrors() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem('app_errors');
    }
  }
}

// Export convenience functions
export const showError = ErrorHandler.showError.bind(ErrorHandler);
export const showSuccess = ErrorHandler.showSuccess.bind(ErrorHandler);
export const confirm = ErrorHandler.confirm.bind(ErrorHandler);
export const logError = ErrorHandler.logError.bind(ErrorHandler);