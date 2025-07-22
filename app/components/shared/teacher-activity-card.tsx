// app/components/shared/teacher-activity-card.tsx
// Path: app/components/shared/teacher-activity-card.tsx
// Enhanced teacher activity card with quick actions and child management

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { 
  Clock, Users, CheckCircle, Circle, AlertCircle, 
  Camera, MessageSquare, TrendingUp, Star, Mic,
  Smile, UserX, UserCheck, ChevronDown, ChevronUp
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/styles';
import { DimensionPills, ProgressBar } from './progress-components';
import { StatusBadge } from '../shared/crud-components';
import { QuickObservationPanel } from './quick-observation-panel';

interface TeacherActivityCardProps {
  activity: {
    id: string;
    curriculum_item_id: string;
    class_id: string;
    scheduled_date: string;
    scheduled_time: string;
    end_time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    teacher_id?: string;
    curriculum_item?: {
      id?: string;
      title: string;
      activity_type: string;
      kmap_dimensions: any;
      duration_minutes: number;
      description?: string;
    };
    progress?: {
      total: number;
      completed: number;
      percentage: number;
    };
    children?: Array<{
      child_id: string;
      name: string;
      first_name?: string;
      last_name?: string;
      attendance: 'present' | 'absent' | 'late' | 'excused';
      progress_status?: string;
      quality_score?: number;
    }>;
  };
  onMarkComplete: () => Promise<{ success: boolean; error?: string }>;
  onMarkIndividual: (childId: string) => void;
  onAddNote?: (activityId: string, childId?: string) => void;
  onAddPhoto?: () => void;
  onAddVoiceNote?: () => void;
  onViewDetails: () => void;
  onQuickReaction?: (reaction: string) => void;
}

// Emoji reactions for quick feedback
const QUICK_REACTIONS = [
  { emoji: '🌟', label: 'Excellent' },
  { emoji: '👏', label: 'Good' },
  { emoji: '💪', label: 'Improving' },
  { emoji: '🤔', label: 'Needs Support' }
];

// Activity status colors and theme
const activityStatusColors = {
  scheduled: colors.gray400,
  in_progress: colors.warning,
  completed: colors.success,
  cancelled: colors.error,
};

const activityCardTheme = {
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden' as const,
    ...shadows.sm,
  },
  statusBar: {
    height: 4,
    width: '100%',
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
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
};

export function TeacherActivityCard({
  activity,
  onMarkComplete,
  onMarkIndividual,
  onAddNote,
  onAddPhoto,
  onAddVoiceNote,
  onViewDetails,
  onQuickReaction
}: TeacherActivityCardProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [selectedChildForNote, setSelectedChildForNote] = useState<string | null>(null);

  const handleMarkComplete = async () => {
    setIsMarking(true);
    try {
      const result = await onMarkComplete();
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to mark activity complete');
      }
    } finally {
      setIsMarking(false);
    }
  };

  const handleAddNote = (childId?: string) => {
    if (onAddNote) {
      onAddNote(activity.id, childId);
    } else {
      setSelectedChildForNote(childId || null);
      setShowObservation(true);
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'completed':
        return <CheckCircle size={20} color={colors.success} />;
      case 'in_progress':
        return <Circle size={20} color={colors.warning} />;
      case 'cancelled':
        return <AlertCircle size={20} color={colors.error} />;
      default:
        return <Clock size={20} color={colors.gray400} />;
    }
  };

  const getEngagementColor = (level?: string) => {
    switch (level) {
      case 'high': return colors.success;
      case 'medium': return colors.warning;
      case 'low': return colors.error;
      default: return colors.gray400;
    }
  };

  // Calculate attendance summary
  const presentChildren = activity.children?.filter(c => c.attendance === 'present') || [];
  const absentChildren = activity.children?.filter(c => c.attendance === 'absent') || [];
  const lateChildren = activity.children?.filter(c => c.attendance === 'late') || [];
  const completedChildren = presentChildren.filter(c => c.progress_status === 'completed');

  return (
    <>
      <View style={activityCardTheme.container}>
        {/* Status Bar */}
        <View 
          style={[
            activityCardTheme.statusBar, 
            { backgroundColor: activityStatusColors[activity.status] }
          ]} 
        />

        <View style={activityCardTheme.content}>
          {/* Header */}
          <View style={activityCardTheme.header}>
            <View style={activityCardTheme.titleSection}>
              {getStatusIcon()}
              <View style={{ flex: 1 }}>
                <Text style={activityCardTheme.title}>
                  {activity.curriculum_item?.title || 'Untitled Activity'}
                </Text>
                <Text style={activityCardTheme.subtitle}>
                  {activity.scheduled_time} - {activity.end_time} • 
                  {activity.curriculum_item?.duration_minutes || 0} mins
                </Text>
              </View>
            </View>
            
            <StatusBadge
              isActive={activity.status === 'completed'}
              activeText="Completed"
              inactiveText={activity.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
            />
          </View>

          {/* Activity Type & K-Map Dimensions */}
          {activity.curriculum_item && (
            <View style={styles.infoRow}>
              <Text style={styles.activityType}>
                {activity.curriculum_item.activity_type?.replace(/_/g, ' ')}
              </Text>
              {activity.curriculum_item.kmap_dimensions && (
                <DimensionPills
                  dimensions={activity.curriculum_item.kmap_dimensions}
                  size="sm"
                  showZero={false}
                />
              )}
            </View>
          )}

          {/* Description if available */}
          {activity.curriculum_item?.description && (
            <Text style={styles.description} numberOfLines={2}>
              {activity.curriculum_item.description}
            </Text>
          )}

          {/* Attendance Summary */}
          <View style={styles.attendanceSummary}>
            <View style={styles.attendanceItem}>
              <UserCheck size={14} color={colors.success} />
              <Text style={styles.attendanceText}>{presentChildren.length} Present</Text>
            </View>
            {absentChildren.length > 0 && (
              <View style={styles.attendanceItem}>
                <UserX size={14} color={colors.error} />
                <Text style={[styles.attendanceText, { color: colors.error }]}>
                  {absentChildren.length} Absent
                </Text>
              </View>
            )}
            {lateChildren.length > 0 && (
              <View style={styles.attendanceItem}>
                <Clock size={14} color={colors.warning} />
                <Text style={[styles.attendanceText, { color: colors.warning }]}>
                  {lateChildren.length} Late
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {presentChildren.length > 0 && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={completedChildren.length / presentChildren.length}
                height={6}
                color={colors.primary}
              />
              <Text style={styles.progressLabel}>
                {completedChildren.length}/{presentChildren.length} children completed
              </Text>
            </View>
          )}

          {/* Quick Reactions */}
          {onQuickReaction && activity.status !== 'completed' && (
            <View style={styles.reactionsContainer}>
              <Text style={styles.reactionLabel}>Quick Feedback:</Text>
              <View style={styles.reactions}>
                {QUICK_REACTIONS.map((reaction) => (
                  <TouchableOpacity
                    key={reaction.emoji}
                    style={styles.reactionButton}
                    onPress={() => onQuickReaction(reaction.emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            {activity.status === 'scheduled' && (
              <TouchableOpacity
                style={[styles.primaryButton, isMarking && styles.disabledButton]}
                onPress={handleMarkComplete}
                disabled={isMarking}
              >
                {isMarking ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <CheckCircle size={16} color={colors.white} />
                    <Text style={styles.primaryButtonText}>Mark Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {activity.status === 'completed' && (
              <View style={styles.completedBadge}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={onAddPhoto}
              >
                <Camera size={18} color={colors.gray600} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleAddNote()}
              >
                <MessageSquare size={18} color={colors.gray600} />
              </TouchableOpacity>

              {onAddVoiceNote && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={onAddVoiceNote}
                >
                  <Mic size={18} color={colors.gray600} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowChildren(!showChildren)}
              >
                <Users size={18} color={colors.gray600} />
                {presentChildren.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{presentChildren.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Expand/Collapse Indicator */}
          {presentChildren.length > 0 && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowChildren(!showChildren)}
            >
              <Text style={styles.expandText}>
                {showChildren ? 'Hide' : 'Show'} Individual Progress
              </Text>
              {showChildren ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}

          {/* Children List (Expandable) */}
          {showChildren && presentChildren.length > 0 && (
            <View style={styles.childrenSection}>
              <Text style={styles.sectionTitle}>Individual Progress</Text>
              {presentChildren.map((child) => (
                <TouchableOpacity
                  key={child.child_id}
                  style={styles.childRow}
                  onPress={() => onMarkIndividual(child.child_id)}
                >
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>
                    {child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim()}
                  </Text>
                    {child.engagement_level && (
                      <View 
                        style={[
                          styles.engagementDot,
                          { backgroundColor: getEngagementColor(child.engagement_level) }
                        ]}
                      />
                    )}
                    {child.quality_score && (
                      <View style={styles.scoreContainer}>
                        <Star size={12} color={colors.warning} />
                        <Text style={styles.scoreText}>{child.quality_score}/5</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.childNoteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddNote(child.child_id);
                      }}
                    >
                      <MessageSquare size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.childStatus}>
                      {child.progress_status === 'completed' ? (
                        <CheckCircle size={16} color={colors.success} />
                      ) : (
                        <Circle size={16} color={colors.gray300} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* View Details Link */}
          <TouchableOpacity 
            style={styles.detailsLink}
            onPress={onViewDetails}
          >
            <Text style={styles.detailsLinkText}>View Full Details</Text>
            <TrendingUp size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Observation Panel */}
      <QuickObservationPanel
        visible={showObservation}
        onClose={() => {
          setShowObservation(false);
          setSelectedChildForNote(null);
        }}
        activityId={activity.id}
        childId={selectedChildForNote || undefined}
        childName={selectedChildForNote ? 
          presentChildren.find(c => c.child_id === selectedChildForNote)?.name : 
          undefined
        }
        activityTitle={activity.curriculum_item?.title}
        onSubmit={(observation) => {
          console.log('Observation submitted:', observation);
          setShowObservation(false);
          setSelectedChildForNote(null);
        }}
      />
    </>
  );
}

const styles = {
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.md,
  },
  activityType: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  description: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  attendanceSummary: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  attendanceItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  attendanceText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reactionsContainer: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  reactionLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reactions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  reactionButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  primaryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
  },
  completedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  completedText: {
    color: colors.success,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
  secondaryActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.full,
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.semibold as any,
  },
  expandButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  expandText: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  childrenSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  childRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  childInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    flex: 1,
  },
  childName: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  engagementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  scoreText: {
    fontSize: typography.xs,
    color: colors.warning,
  },
  childActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  childNoteButton: {
    padding: spacing.xs,
  },
  childStatus: {
    padding: spacing.xs,
  },
  detailsLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  detailsLinkText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },
};