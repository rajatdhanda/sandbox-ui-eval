// app/components/shared/search-input.tsx
// Path: app/components/shared/search-input.tsx

import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/styles';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Search...",
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <Search size={20} color={colors.textSecondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
  }
};