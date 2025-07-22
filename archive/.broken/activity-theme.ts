// lib/styles/themes/activity-theme.ts
// Path: lib/styles/themes/activity-theme.ts

import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

// Status color mapping for activities
export const activityStatusColors = {
  scheduled: colors.gray400,
  pending: colors.gray400,
  in_progress: colors.warning,
  completed: colors.success,
  cancelled: colors.error,
  absent: colors.gray300,
};

// Activity card styles
export const activityCardTheme = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden' as const,
  },
  statusBar: {
    height: 4,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  titleSection: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  iconSize: 20,
};

// Progress bar theme
export const progressTheme = {
  container: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  label: {
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
    backgroundColor: colors.success,
  },
};

// K-Map dimension pills theme
export const dimensionPillTheme = {
  container: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pill: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },
};

// Quick action buttons theme
export const actionButtonTheme = {
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  secondary: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  icon: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
  },
  text: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
  textSecondary: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
};

// Layout theme for the page
export const activityLayoutTheme = {
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listSection: {
    paddingHorizontal: spacing.lg,
  },
  statsSpacing: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xxl * 2,
  },
};

// Helper function to get status icon
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react-native';

export const getActivityStatusIcon = (status: string) => {
  const color = activityStatusColors[status] || colors.gray400;
  const size = activityCardTheme.iconSize;
  
  switch (status) {
    case 'completed':
      return <CheckCircle size={size} color={color} />;
    case 'in_progress':
      return <Clock size={size} color={color} />;
    case 'cancelled':
      return <XCircle size={size} color={color} />;
    default:
      return <AlertCircle size={size} color={color} />;
  }
};