// app/components/shared/branded-header.tsx
// Path: app/components/shared/branded-header.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun } from 'lucide-react-native';
import { brand } from '@/lib/config/brand-config';

interface BrandedHeaderProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionText?: string;
  compact?: boolean;
  showLogo?: boolean;
  rightContent?: React.ReactNode;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  subtitle,
  onAction,
  actionIcon,
  actionText,
  compact = false,
  showLogo = true,
  rightContent
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showLogo && !compact && (
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Sun size={24} color={brand.colors.primary} />
              </View>
            </View>
          )}
          
          <View style={styles.textSection}>
            {!compact && (
              <>
                <Text style={styles.brandName}>{brand.name}</Text>
                <Text style={styles.title}>{title}</Text>
              </>
            )}
            {compact ? (
              <Text style={styles.compactTitle}>{title}</Text>
            ) : (
              subtitle && <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.rightSection}>
          {rightContent}
          {onAction && (
            <TouchableOpacity 
              style={[styles.actionButton, compact && styles.actionButtonCompact]}
              onPress={onAction}
            >
              {actionIcon}
              {!compact && actionText && (
                <Text style={styles.actionButtonText}>{actionText}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: brand.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brand.colors.gray[200],
    paddingVertical: brand.spacing.lg,
    paddingHorizontal: brand.spacing.xl,
    ...brand.shadows.sm,
  },
  containerCompact: {
    paddingVertical: brand.spacing.md,
  },
  content: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  leftSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  logoContainer: {
    marginRight: brand.spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: brand.borderRadius.full,
    backgroundColor: brand.colors.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textSection: {
    flex: 1,
  },
  brandName: {
    fontSize: brand.typography.sizes.xs,
    fontWeight: brand.typography.weights.medium,
    color: brand.colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: brand.spacing.xs,
  },
  title: {
    fontSize: brand.typography.sizes.xl,
    fontWeight: brand.typography.weights.semibold,
    color: brand.colors.textPrimary,
    marginBottom: brand.spacing.xs,
  },
  compactTitle: {
    fontSize: brand.typography.sizes.lg,
    fontWeight: brand.typography.weights.semibold,
    color: brand.colors.textPrimary,
  },
  subtitle: {
    fontSize: brand.typography.sizes.sm,
    color: brand.colors.textSecondary,
  },
  rightSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: brand.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: brand.colors.primary,
    paddingHorizontal: brand.spacing.lg,
    paddingVertical: brand.spacing.sm,
    borderRadius: brand.borderRadius.lg,
    gap: brand.spacing.sm,
    ...brand.shadows.sm,
  },
  actionButtonCompact: {
    paddingHorizontal: brand.spacing.md,
    paddingVertical: brand.spacing.sm,
  },
  actionButtonText: {
    color: brand.colors.textInverse,
    fontSize: brand.typography.sizes.base,
    fontWeight: brand.typography.weights.medium,
  },
};