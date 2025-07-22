// app/components/shared/form-controls.tsx
// Path: app/components/shared/form-controls.tsx
// Unified form control components - preserves all original functionality

import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle, Clock, Check, LucideIcon } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';

// ============================================
// Original button-styles.tsx content (preserved exactly)
// ============================================
export const buttonStyles = {
  // Standard button (like class management)
  standard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    minHeight: 36,
  },
  // Compact button for status
  compact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    minHeight: 32,
  },
  // Text styles
  text: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  textSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  }
};

// ============================================
// Enhanced form control styles (new additions)
// ============================================
export const formControlStyles = {
  button: buttonStyles, // Keep backward compatibility
  
  // New variant system for future use
  variants: {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.gray100,
      borderColor: colors.gray200,
    },
    outline: {
      backgroundColor: colors.white,
      borderColor: colors.gray300,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
  },
};

// ============================================
// StatusButton (preserved exactly from original)
// ============================================
interface StatusButtonProps {
  status: 'present' | 'late' | 'absent';
  isSelected: boolean;
  onPress: () => void;
}

export function StatusButton({ status, isSelected, onPress }: StatusButtonProps) {
  const getColors = () => {
    switch(status) {
      case 'present': 
        return { 
          border: colors.primary, 
          bg: isSelected ? colors.primary : colors.white,
          text: isSelected ? colors.white : colors.primary
        };
      case 'late': 
        return { 
          border: '#F59E0B', // Preserved hardcoded color
          bg: isSelected ? '#F59E0B' : colors.white,
          text: isSelected ? colors.white : '#F59E0B'
        };
      case 'absent': 
        return { 
          border: colors.secondary, 
          bg: isSelected ? colors.secondary : colors.white,
          text: isSelected ? colors.white : colors.secondary
        };
    }
  };
  
  const Icon = status === 'present' ? CheckCircle2 : status === 'late' ? Clock : XCircle;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorConfig = getColors();
  
  return (
    <TouchableOpacity
      style={[buttonStyles.compact, { 
        borderColor: colorConfig.border,
        backgroundColor: colorConfig.bg,
        minWidth: 75,
      }]}
      onPress={onPress}
    >
      <Icon size={14} color={colorConfig.text} />
      <Text style={[buttonStyles.textSmall, { color: colorConfig.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// ConfirmButton (preserved exactly from original)
// ============================================
interface ConfirmButtonProps {
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

export function ConfirmButton({ onConfirm, loading, disabled, title = 'Confirm Changes' }: ConfirmButtonProps) {
  return (
    <TouchableOpacity 
      style={[confirmButtonStyles.button, (disabled || loading) && confirmButtonStyles.disabled]} 
      onPress={onConfirm}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Check size={20} color={colors.white} />
      )}
      <Text style={confirmButtonStyles.text}>{loading ? 'Saving...' : title}</Text>
    </TouchableOpacity>
  );
}

// Original ConfirmButton styles preserved
const confirmButtonStyles = {
  button: { 
    margin: 20, 
    backgroundColor: colors.primary, 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    justifyContent: 'center' as const, 
    gap: 8 
  },
  disabled: { 
    backgroundColor: colors.gray400 
  },
  text: { 
    color: colors.white, 
    fontSize: 16, 
    fontWeight: '600' as const 
  },
};

// ============================================
// NEW: Generic Button Component (enhancement)
// ============================================
interface ButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  loading = false,
  disabled = false,
  style,
}) => {
  const sizeMap = {
    sm: buttonStyles.compact,
    md: buttonStyles.standard,
    lg: buttonStyles.standard, // Use standard with extra padding
  };

  const variantStyle = formControlStyles.variants[variant];
  const textColor = variant === 'primary' || variant === 'danger' ? colors.white : colors.textPrimary;

  return (
    <TouchableOpacity
      style={[
        sizeMap[size],
        variantStyle,
        size === 'lg' && { paddingVertical: 12, paddingHorizontal: 24 },
        disabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} color={textColor} />
      ) : null}
      {typeof children === 'string' ? (
        <Text style={[
          size === 'sm' ? buttonStyles.textSmall : buttonStyles.text,
          { color: textColor }
        ]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// ============================================
// NEW: Enhanced StatusButton with more statuses
// ============================================
export type ExtendedStatus = 'present' | 'late' | 'absent' | 'completed' | 'pending' | 'skipped';

interface ExtendedStatusButtonProps {
  status: ExtendedStatus;
  isSelected: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}

// Configuration for extended statuses
const extendedStatusConfig: Record<ExtendedStatus, { icon: LucideIcon; color: string; label: string }> = {
  present: { icon: CheckCircle2, color: colors.primary, label: 'Present' },
  late: { icon: Clock, color: '#F59E0B', label: 'Late' },
  absent: { icon: XCircle, color: colors.secondary, label: 'Absent' },
  completed: { icon: CheckCircle2, color: colors.success, label: 'Done' },
  pending: { icon: Clock, color: colors.gray400, label: 'Pending' },
  skipped: { icon: XCircle, color: colors.gray500, label: 'Skipped' },
};

export function ExtendedStatusButton({ status, isSelected, onPress, size = 'sm' }: ExtendedStatusButtonProps) {
  const config = extendedStatusConfig[status];
  const Icon = config.icon;
  
  const buttonSize = size === 'sm' ? buttonStyles.compact : buttonStyles.standard;
  const textSize = size === 'sm' ? buttonStyles.textSmall : buttonStyles.text;
  
  return (
    <TouchableOpacity
      style={[
        buttonSize,
        {
          backgroundColor: isSelected ? config.color : colors.white,
          borderColor: config.color,
          minWidth: size === 'sm' ? 75 : 90,
        },
      ]}
      onPress={onPress}
    >
      <Icon 
        size={size === 'sm' ? 14 : 16} 
        color={isSelected ? colors.white : config.color} 
      />
      <Text style={[textSize, { color: isSelected ? colors.white : config.color }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}