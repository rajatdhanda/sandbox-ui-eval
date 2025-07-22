// app/components/shared/dimension-pills.tsx
// Path: app/components/shared/dimension-pills.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';

interface DimensionPillsProps {
  dimensions: Record<string, number>;
  showZero?: boolean;
  colors?: Record<string, string>;
}

export const DimensionPills: React.FC<DimensionPillsProps> = ({
  dimensions,
  showZero = false,
  colors: customColors
}) => {
  // Default colors for K-Map dimensions
  const defaultColors = {
    move: colors.success,
    think: colors.info,
    endure: colors.warning,
  };
  
  const pillColors = customColors || defaultColors;
  
  const activeDimensions = Object.entries(dimensions)
    .filter(([_, weight]) => showZero || weight > 0);
  
  if (activeDimensions.length === 0) return null;
  
  return (
    <View style={styles.container}>
      {activeDimensions.map(([dim, weight]) => {
        const pillColor = pillColors[dim] || colors.primary;
        return (
          <View 
            key={dim} 
            style={[
              styles.pill,
              { backgroundColor: pillColor + '15' }
            ]}
          >
            <Text style={[styles.text, { color: pillColor }]}>
              {dim}: {weight}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: typography.xs,
    fontWeight: typography.medium as any,
    textTransform: 'capitalize' as any,
  },
};