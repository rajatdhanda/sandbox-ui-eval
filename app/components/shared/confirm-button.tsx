// components/shared/confirm-button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface Props {
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

export function ConfirmButton({ onConfirm, loading, disabled, title = 'Confirm Changes' }: Props) {
  return (
    <TouchableOpacity 
      style={[styles.button, (disabled || loading) && styles.disabled]} 
      onPress={onConfirm}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Check size={20} color={colors.white} />
      )}
      <Text style={styles.text}>{loading ? 'Saving...' : title}</Text>
    </TouchableOpacity>
  );
}

const styles = {
  button: { margin: 20, backgroundColor: colors.primary, padding: 16, borderRadius: 12, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  disabled: { backgroundColor: colors.gray400 },
  text: { color: colors.white, fontSize: 16, fontWeight: '600' as const },
};