// lib/utils/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  action: string;
  data?: any;
  error?: any;
  duration?: number;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#6B7280'; // Gray
      case LogLevel.INFO: return '#3B82F6';  // Blue
      case LogLevel.WARN: return '#F59E0B';  // Amber
      case LogLevel.ERROR: return '#EF4444'; // Red
      default: return '#1F2937';
    }
  }

  private getLogIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  debug(module: string, action: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      module,
      action,
      data
    };
    
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.log(
        `%c${this.getLogIcon(LogLevel.DEBUG)} [${module}] ${action}`,
        `color: ${this.getLogColor(LogLevel.DEBUG)}`,
        data || ''
      );
    }
  }

  info(module: string, action: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      module,
      action,
      data
    };
    
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.log(
        `%c${this.getLogIcon(LogLevel.INFO)} [${module}] ${action}`,
        `color: ${this.getLogColor(LogLevel.INFO)}`,
        data || ''
      );
    }
  }

  warn(module: string, action: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      module,
      action,
      data
    };
    
    this.addLog(entry);
    
    console.warn(
      `${this.getLogIcon(LogLevel.WARN)} [${module}] ${action}`,
      data || ''
    );
  }

  error(module: string, action: string, error: any, data?: any) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      module,
      action,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      data
    };
    
    this.addLog(entry);
    
    console.error(
      `${this.getLogIcon(LogLevel.ERROR)} [${module}] ${action}`,
      error,
      data || ''
    );
  }

  // Performance logging
  startTimer(module: string, action: string): () => void {
    const startTime = Date.now();
    this.debug(module, `${action} - STARTED`);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(module, `${action} - COMPLETED`, { duration: `${duration}ms` });
    };
  }

  // API call logging
  apiCall(module: string, method: string, endpoint: string, params?: any) {
    this.info(module, `API_CALL`, {
      method,
      endpoint,
      params: params ? JSON.stringify(params) : undefined,
      timestamp: this.formatTimestamp()
    });
  }

  apiResponse(module: string, method: string, endpoint: string, success: boolean, data?: any, error?: any) {
    if (success) {
      this.info(module, `API_SUCCESS`, {
        method,
        endpoint,
        dataLength: Array.isArray(data) ? data.length : data ? 1 : 0,
        timestamp: this.formatTimestamp()
      });
    } else {
      this.error(module, `API_ERROR`, error, {
        method,
        endpoint,
        timestamp: this.formatTimestamp()
      });
    }
  }

  // Database operation logging
  dbOperation(module: string, operation: string, table: string, filters?: any, data?: any) {
    this.info(module, `DB_${operation.toUpperCase()}`, {
      table,
      filters,
      data: data ? (Array.isArray(data) ? `${data.length} records` : 'single record') : undefined
    });
  }

  dbResult(module: string, operation: string, table: string, success: boolean, result?: any, error?: any) {
    if (success) {
      this.info(module, `DB_${operation.toUpperCase()}_SUCCESS`, {
        table,
        resultCount: Array.isArray(result) ? result.length : result ? 1 : 0
      });
    } else {
      this.error(module, `DB_${operation.toUpperCase()}_ERROR`, error, { table });
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any) {
    this.debug('COMPONENT', `${componentName}_MOUNT`, props);
  }

  componentUnmount(componentName: string) {
    this.debug('COMPONENT', `${componentName}_UNMOUNT`);
  }

  userAction(module: string, action: string, data?: any) {
    this.info(module, `USER_${action.toUpperCase()}`, data);
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('LOGGER', 'LOGS_CLEARED');
  }
}

export const logger = new Logger();

// Convenience functions for common logging patterns
export const logApiCall = (module: string, method: string, endpoint: string, params?: any) => {
  logger.apiCall(module, method, endpoint, params);
};

export const logApiResponse = (module: string, method: string, endpoint: string, success: boolean, data?: any, error?: any) => {
  logger.apiResponse(module, method, endpoint, success, data, error);
};

export const logDbOperation = (module: string, operation: string, table: string, filters?: any, data?: any) => {
  logger.dbOperation(module, operation, table, filters, data);
};

export const logDbResult = (module: string, operation: string, table: string, success: boolean, result?: any, error?: any) => {
  logger.dbResult(module, operation, table, success, result, error);
};

export const logUserAction = (module: string, action: string, data?: any) => {
  logger.userAction(module, action, data);
};

export const startTimer = (module: string, action: string) => {
  return logger.startTimer(module, action);
};

// Network monitoring
export const logNetworkState = (isConnected: boolean) => {
  logger.info('NETWORK', isConnected ? 'CONNECTED' : 'DISCONNECTED');
};

// Error boundary logging
export const logErrorBoundary = (error: Error, errorInfo: any) => {
  logger.error('ERROR_BOUNDARY', 'COMPONENT_ERROR', error, errorInfo);
};

export default logger;