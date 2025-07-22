// app/components/shared/filter-pills.tsx
// Path: app/components/shared/filter-pills.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/styles';

interface FilterPillsProps {
  filters: {
    key: string;
    label: string;
    isActive: boolean;
  }[];
  onFilterChange: (key: string) => void;
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (text: string) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  filters,
  onFilterChange,
  showSearch = false,
  searchTerm = '',
  onSearchChange,
}) => {
  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.gray500} />
          <input
            style={styles.searchInput}
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </View>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.pillsContainer}
      >
        <View style={styles.pillsRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.pill,
                filter.isActive && styles.pillActive
              ]}
              onPress={() => onFilterChange(filter.key)}
            >
              <Text
                style={[
                  styles.pillText,
                  filter.isActive && styles.pillTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  pillsContainer: {
    marginHorizontal: -spacing.xl,
  },
  pillsRow: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  pillTextActive: {
    color: colors.white,
  },
};