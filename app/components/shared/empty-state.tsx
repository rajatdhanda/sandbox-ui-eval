// app/components/shared/empty-state.tsx
// Path: app/components/shared/empty-state.tsx

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/styles';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action
}) => {
  // Smart icon rendering to prevent "Objects are not valid as a React child" error
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's already a React element, render it
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    // If it's a component (function), render it with default props
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent size={48} color={colors.gray400} />;
    }
    
    // For any other case, just return the icon as-is
    return icon;
  };

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{renderIcon()}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
};

// ✅ LoadingState component
interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'large',
  fullScreen = false 
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.loadingMessage}>{message}</Text>}
    </View>
  );
};

// ✅ ErrorState component - REQUIRED by tech bible
interface ErrorStateProps {
  error: string | Error;
  retry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  retry 
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
  
  return (
    <EmptyState
      icon={<AlertCircle size={48} color={colors.error} />}
      title="Something went wrong"
      subtitle={errorMessage}
      action={
        retry ? (
          <View style={styles.retryButton}>
            <Text style={styles.retryButtonText} onPress={retry}>
              Try Again
            </Text>
          </View>
        ) : undefined
      }
    />
  );
};

const styles = {
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.lg,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
  loadingMessage: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: '600' as any,
  }
};