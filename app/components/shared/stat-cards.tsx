// app/components/shared/stat-cards.tsx
// Path: app/components/shared/stat-cards.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/styles';

interface StatItem {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
}

interface StatCardsProps {
  stats: StatItem[];
  columns?: number;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, columns = 4 }) => {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View 
          key={index} 
          style={[
            styles.card,
            { width: `${(100 / columns) - 2}%` }
          ]}
        >
          <View style={[styles.iconContainer, stat.color && { backgroundColor: stat.color + '15' }]}>
            {stat.icon}
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center' as const,
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  value: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
};