// app/components/shared/relationship-card.tsx
// Path: app/components/shared/relationship-card.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Link2, Heart, Edit2, Trash2, Users, Baby } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/styles';

interface RelationshipCardProps {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  type: 'parent-child' | 'teacher-class' | 'curriculum';
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  item,
  onEdit,
  onDelete,
  type
}) => {
  const getRelationshipIcon = () => {
    switch (type) {
      case 'parent-child':
        return <Users size={20} color={colors.primary} />;
      case 'teacher-class':
        return <Link2 size={20} color={colors.warning} />;
      case 'curriculum':
        return <Baby size={20} color={colors.success} />;
    }
  };

  const getRelationshipColor = () => {
    switch (type) {
      case 'parent-child':
        return colors.primary;
      case 'teacher-class':
        return colors.warning;
      case 'curriculum':
        return colors.success;
    }
  };

  const getParentLabel = () => {
    switch (type) {
      case 'parent-child':
        return item.parent?.full_name || 'Unknown Parent';
      case 'teacher-class':
        return item.teacher?.full_name || 'Unknown Teacher';
      case 'curriculum':
        return item.curriculum_template?.name || 'Unknown Curriculum';
    }
  };

  const getChildLabel = () => {
    switch (type) {
      case 'parent-child':
        return `${item.child?.first_name || ''} ${item.child?.last_name || ''}`.trim() || 'Unknown Child';
      case 'teacher-class':
        return item.class?.name || 'Unknown Class';
      case 'curriculum':
        return item.class?.name || 'Unknown Class';
    }
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.98}>
      <View style={[styles.colorBar, { backgroundColor: getRelationshipColor() }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getRelationshipIcon()}
          </View>
          
          <View style={styles.relationshipInfo}>
            <Text style={styles.parentName}>{getParentLabel()}</Text>
            <View style={styles.arrow}>
              <View style={styles.arrowLine} />
              <Text style={styles.arrowText}>→</Text>
            </View>
            <Text style={styles.childName}>{getChildLabel()}</Text>
          </View>

          {item.is_primary && (
            <View style={styles.primaryBadge}>
              <Heart size={12} color={colors.error} fill={colors.error} />
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.metadata}>
            {item.relationship_type && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.relationship_type}</Text>
              </View>
            )}
            {item.created_at && (
              <Text style={styles.dateText}>
                Added {new Date(item.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onEdit}
            >
              <Edit2 size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden' as const,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  relationshipInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  parentName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  arrow: {
    marginHorizontal: spacing.sm,
    alignItems: 'center' as const,
  },
  arrowLine: {
    position: 'absolute' as const,
    height: 1,
    width: 30,
    backgroundColor: colors.gray300,
    top: '50%',
  },
  arrowText: {
    fontSize: typography.sm,
    color: colors.gray500,
  },
  childName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right' as const,
  },
  primaryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  primaryText: {
    fontSize: typography.xs,
    color: colors.error,
    marginLeft: spacing.xs,
    fontWeight: typography.medium,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  metadata: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tagText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  dateText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
  },
};