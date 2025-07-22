// app/components/shared/activity-actions.tsx
// Path: app/components/shared/activity-actions.tsx

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Camera, Edit2, CheckCircle, Clock, Play } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';

interface ActivityActionsProps {
  status?: string;
  onQuickLog?: () => void;
  onPhotoUpload?: () => void;
  onEdit?: () => void;
  onStart?: () => void;
  variant?: 'full' | 'compact' | 'icon-only';
  disabled?: boolean;
}

export const ActivityActions: React.FC<ActivityActionsProps> = ({
  status = 'scheduled',
  onQuickLog,
  onPhotoUpload,
  onEdit,
  onStart,
  variant = 'full',
  disabled = false
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  
  const getLogIcon = () => {
    if (isCompleted) return <CheckCircle size={18} color={colors.white} />;
    if (isInProgress) return <Clock size={18} color={colors.white} />;
    return <Play size={18} color={colors.white} />;
  };
  
  const getLogText = () => {
    if (isCompleted) return 'Update';
    if (isInProgress) return 'Complete';
    return 'Start';
  };
  
  return (
    <View style={styles.container}>
      {onPhotoUpload && (
        <TouchableOpacity
          onPress={onPhotoUpload}
          style={styles.iconButton}
          disabled={disabled}
        >
          <Camera size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      
      {onEdit && variant === 'full' && (
        <TouchableOpacity
          onPress={onEdit}
          style={styles.iconButton}
          disabled={disabled}
        >
          <Edit2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      
      {(onQuickLog || onStart) && (
        <TouchableOpacity
          onPress={onQuickLog || onStart}
          style={[
            styles.primaryButton,
            isCompleted && styles.secondaryButton,
            disabled && styles.disabledButton
          ]}
          disabled={disabled}
        >
          {variant === 'icon-only' ? (
            getLogIcon()
          ) : (
            <>
              {variant === 'compact' && getLogIcon()}
              <Text style={[
                styles.buttonText,
                isCompleted && styles.buttonTextSecondary,
                disabled && styles.buttonTextDisabled
              ]}>
                {getLogText()}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    alignItems: 'center' as const,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
  },
  primaryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: colors.gray100,
  },
  disabledButton: {
    backgroundColor: colors.gray200,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
  buttonTextSecondary: {
    color: colors.textPrimary,
  },
  buttonTextDisabled: {
    color: colors.gray400,
  },
};