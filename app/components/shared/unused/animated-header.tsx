// app/components/shared/animated-header.tsx
// Path: app/components/shared/animated-header.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Plus, Activity } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/styles';

interface AnimatedHeaderProps {
  title: string;
  subtitle: string;
  onAdd: () => void;
  onShowLogs?: () => void;
  addButtonText?: string;
  style?: any;
  rightActions?: React.ReactNode;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  onAdd,
  onShowLogs,
  addButtonText = 'Add Item',
  style,
  rightActions
}) => {
  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        
        <View style={styles.actions}>
          {onShowLogs && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={onShowLogs}
            >
              <Activity size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {rightActions}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAdd}
          >
            <Plus size={20} color={colors.white} />
            <Text style={styles.addButtonText}>{addButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = {
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  debugButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
};