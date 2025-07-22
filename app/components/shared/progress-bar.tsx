// app/components/shared/progress-bar.tsx
// Path: app/components/shared/progress-bar.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  color?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  color = colors.success,
  showText = true
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {showText && (
        <Text style={styles.text}>
          {current}/{total} completed
        </Text>
      )}
      <View style={styles.track}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = {
  container: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  track: {
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    overflow: 'hidden' as const,
  },
  fill: {
    height: '100%',
  },
};