// app/components/shared/learning-activity-card.tsx
// Path: app/components/shared/learning-activity-card.tsx
// Enhanced reusable card component for displaying learning activities

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Clock, Users, Target, TrendingUp, BookOpen, 
  Brain, Zap, Heart, ChevronRight, Award,
  CheckCircle2, Circle, AlertCircle, PlayCircle,
  FileText, Image, Music, Palette, Gamepad2,
  Info, Star, BarChart3, Sparkles
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';
import { ProgressBar } from './progress-components';

interface LearningActivityCardProps {
  activity: {
    id: string;
    title: string;
    description?: string;
    activityType: string;
    duration: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    kmapDimensions: {
      move: number;
      think: number;
      endure: number;
    };
    scheduledTime?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    progress?: {
      enrolled: number;
      completed: number;
      percentage: number;
    };
    averageScore?: number;
    milestoneCount?: number;
    materials?: string[];
    objectives?: string[];
    instructions?: string;
    mediaCount?: { photos: number; videos: number; documents: number };
    completionTime?: number;
    // Add these for real data compatibility
    curriculum_item?: {
      title?: string;
      activity_type?: string;
      duration_minutes?: number;
      kmap_dimensions?: any;
    };
  };
  variant?: 'default' | 'compact' | 'detailed' | 'preview';
  showProgress?: boolean;
  showKMap?: boolean;
  showObjectives?: boolean;
  onPress?: () => void;
  onActionPress?: () => void;
  onStartActivity?: () => void;
  actionIcon?: React.ReactNode;
  disabled?: boolean;
  isTeacherView?: boolean;
}

// Enhanced activity type mapping with colors and icons
const ACTIVITY_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'circle_time': { icon: Users, color: '#FF6B6B', label: 'Circle Time' },
  'outdoor_play': { icon: Zap, color: '#4ECDC4', label: 'Outdoor Play' },
  'story_time': { icon: BookOpen, color: '#45B7D1', label: 'Story Time' },
  'art_craft': { icon: Palette, color: '#96CEB4', label: 'Arts & Crafts' },
  'music_movement': { icon: Music, color: '#DDA0DD', label: 'Music & Movement' },
  'free_play': { icon: Gamepad2, color: '#FFB347', label: 'Free Play' },
  'learning_center': { icon: Brain, color: '#9370DB', label: 'Learning Center' },
  'sensory_play': { icon: Heart, color: '#FF69B4', label: 'Sensory Play' },
  'stem_activity': { icon: Target, color: '#32CD32', label: 'STEM Activity' },
};

const DIMENSION_CONFIG = {
  move: { color: colors.error, label: 'Physical', icon: Zap },
  think: { color: colors.warning, label: 'Cognitive', icon: Brain },
  endure: { color: colors.success, label: 'Social-Emotional', icon: Heart },
};

const DIFFICULTY_CONFIG = {
  easy: { color: colors.success, stars: 1 },
  medium: { color: colors.warning, stars: 2 },
  hard: { color: colors.error, stars: 3 },
};

// Skeleton loader component
const SkeletonLoader = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12 }]} />
      </View>
    </View>
    <View style={[styles.skeletonLine, { width: '100%', height: 6, marginTop: spacing.md }]} />
  </View>
);

// Helper to transform database activity to component props
export const transformActivityData = (dbActivity: any): any => {
  return {
    id: dbActivity.id,
    title: dbActivity.curriculum_item?.title || dbActivity.title || 'Untitled Activity',
    description: dbActivity.curriculum_item?.description || dbActivity.description,
    activityType: dbActivity.curriculum_item?.activity_type || dbActivity.activity_type || 'learning_center',
    duration: dbActivity.curriculum_item?.duration_minutes || dbActivity.duration || 30,
    kmapDimensions: dbActivity.curriculum_item?.kmap_dimensions || dbActivity.kmapDimensions || { move: 0, think: 0, endure: 0 },
    scheduledTime: dbActivity.scheduled_time,
    status: dbActivity.status,
    progress: dbActivity.progress,
    averageScore: dbActivity.average_score,
    milestoneCount: dbActivity.milestone_count,
  };
};

export function LearningActivityCard({
  activity,
  variant = 'default',
  showProgress = true,
  showKMap = true,
  showObjectives = false,
  onPress,
  onActionPress,
  onStartActivity,
  actionIcon,
  disabled = false,
  isTeacherView = false,
}: LearningActivityCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const activityConfig = ACTIVITY_TYPE_CONFIG[activity.activityType] || {
    icon: BookOpen,
    color: colors.primary,
    label: activity.activityType
  };
  
  const Icon = activityConfig.icon;
  const isCompleted = activity.status === 'completed';
  const isInProgress = activity.status === 'in_progress';
  
  // Calculate dominant K-Map dimension
  const dominantDimension = Object.entries(activity.kmapDimensions)
    .sort(([, a], [, b]) => b - a)[0][0] as keyof typeof DIMENSION_CONFIG;
  
  // Calculate K-Map balance score
  const calculateBalance = () => {
    const values = Object.values(activity.kmapDimensions);
    const avg = values.reduce((a, b) => a + b, 0) / 3;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 3;
    return Math.round(Math.max(0, 100 - (Math.sqrt(variance) / 5) * 100));
  };

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar
    if (activity.progress) {
      Animated.timing(progressAnim, {
        toValue: activity.progress.percentage / 100,
        duration: 1000,
        delay: 300,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'completed':
        return <CheckCircle2 size={20} color={colors.success} />;
      case 'in_progress':
        return (
          <Animated.View style={{ transform: [{ rotate: '360deg' }] }}>
            <PlayCircle size={20} color={colors.warning} />
          </Animated.View>
        );
      case 'cancelled':
        return <AlertCircle size={20} color={colors.error} />;
      default:
        return <Circle size={20} color={colors.gray400} />;
    }
  };

  const renderDifficultyStars = () => {
    if (!activity.difficulty) return null;
    const config = DIFFICULTY_CONFIG[activity.difficulty];
    
    return (
      <View style={styles.difficultyContainer}>
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            size={12}
            color={config.color}
            fill={i < config.stars ? config.color : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderMediaBadges = () => {
    if (!activity.mediaCount) return null;
    const { photos, videos, documents } = activity.mediaCount;
    
    return (
      <View style={styles.mediaBadges}>
        {photos > 0 && (
          <View style={styles.mediaBadge}>
            <Image size={12} color={colors.gray600} />
            <Text style={styles.mediaBadgeText}>{photos}</Text>
          </View>
        )}
        {videos > 0 && (
          <View style={styles.mediaBadge}>
            <PlayCircle size={12} color={colors.gray600} />
            <Text style={styles.mediaBadgeText}>{videos}</Text>
          </View>
        )}
        {documents > 0 && (
          <View style={styles.mediaBadge}>
            <FileText size={12} color={colors.gray600} />
            <Text style={styles.mediaBadgeText}>{documents}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCompactCard = () => (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.compactCard,
          isCompleted && styles.completedCard,
          disabled && styles.disabledCard
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.compactLeft}>
          {getStatusIcon()}
          <View style={[styles.compactIcon, { backgroundColor: activityConfig.color + '20' }]}>
            <Icon size={20} color={activityConfig.color} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, isCompleted && styles.completedText]}>
              {activity.title}
            </Text>
            <View style={styles.compactMeta}>
              <Clock size={12} color={colors.gray500} />
              <Text style={styles.compactMetaText}>{activity.duration} min</Text>
              {activity.scheduledTime && (
                <>
                  <Text style={styles.compactMetaText}>•</Text>
                  <Text style={styles.compactMetaText}>{activity.scheduledTime}</Text>
                </>
              )}
              {renderDifficultyStars()}
            </View>
          </View>
        </View>
        {onActionPress && (
          <TouchableOpacity onPress={onActionPress} style={styles.compactAction}>
            {actionIcon || <ChevronRight size={20} color={colors.gray400} />}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDefaultCard = () => (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isCompleted && styles.completedCard,
          disabled && styles.disabledCard
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {/* Color indicator bar */}
        <View style={[styles.colorBar, { backgroundColor: activityConfig.color }]} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: activityConfig.color + '20' }]}>
            <Icon size={24} color={activityConfig.color} />
            {isInProgress && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, isCompleted && styles.completedText]}>
                {activity.title}
              </Text>
              {activity.milestoneCount && activity.milestoneCount > 0 && (
                <View style={styles.milestoneBadge}>
                  <Award size={14} color={colors.warning} />
                  <Text style={styles.milestoneBadgeText}>{activity.milestoneCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.activityTypeLabel}>{activityConfig.label}</Text>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.gray500} />
                <Text style={styles.metaText}>{activity.duration} min</Text>
                {activity.completionTime && (
                  <Text style={styles.metaText}>
                    (actual: {activity.completionTime} min)
                  </Text>
                )}
              </View>
              {renderDifficultyStars()}
            </View>
          </View>
          {getStatusIcon()}
        </View>

        {/* Description */}
        {activity.description && (
          <Text style={styles.description} numberOfLines={2}>
            {activity.description}
          </Text>
        )}

        {/* Media Badges */}
        {renderMediaBadges()}

        {/* K-Map Visualization */}
        {showKMap && (
          <View style={styles.kmapSection}>
            <View style={styles.kmapHeader}>
              <Text style={styles.kmapTitle}>Development Focus</Text>
              <View style={styles.balanceScore}>
                <BarChart3 size={14} color={colors.primary} />
                <Text style={styles.balanceScoreText}>
                  {calculateBalance()}% balanced
                </Text>
              </View>
            </View>
            <View style={styles.kmapBars}>
              {Object.entries(activity.kmapDimensions).map(([dimension, value]) => {
                const config = DIMENSION_CONFIG[dimension as keyof typeof DIMENSION_CONFIG];
                const DimIcon = config.icon;
                return (
                  <View key={dimension} style={styles.kmapItem}>
                    <View style={styles.kmapLabelRow}>
                      <DimIcon size={16} color={config.color} />
                      <Text style={styles.kmapLabel}>{config.label}</Text>
                      <Text style={styles.kmapValue}>{value}/10</Text>
                    </View>
                    <View style={styles.kmapBarContainer}>
                      <Animated.View 
                        style={[
                          styles.kmapBar, 
                          { 
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${(value / 10) * 100}%`]
                            }),
                            backgroundColor: config.color 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Objectives (if shown) */}
        {showObjectives && activity.objectives && activity.objectives.length > 0 && (
          <View style={styles.objectivesSection}>
            <Text style={styles.sectionTitle}>Learning Objectives</Text>
            {activity.objectives.slice(0, 2).map((objective, index) => (
              <View key={index} style={styles.objectiveItem}>
                <Target size={12} color={colors.primary} />
                <Text style={styles.objectiveText}>{objective}</Text>
              </View>
            ))}
            {activity.objectives.length > 2 && (
              <Text style={styles.moreText}>+{activity.objectives.length - 2} more</Text>
            )}
          </View>
        )}

        {/* Progress Section */}
        {showProgress && activity.progress && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Class Progress</Text>
              <View style={styles.progressStats}>
                <Users size={14} color={colors.gray600} />
                <Text style={styles.progressText}>
                  {activity.progress.completed}/{activity.progress.enrolled}
                </Text>
                {activity.averageScore !== undefined && (
                  <>
                    <Text style={styles.progressText}>•</Text>
                    <TrendingUp size={14} color={colors.success} />
                    <Text style={styles.progressText}>
                      {activity.averageScore.toFixed(1)}/5
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.progressBarWrapper}>
              <Animated.View
                style={[
                  styles.animatedProgressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              >
                <ProgressBar 
                  progress={activity.progress.percentage / 100} 
                  height={8}
                  color={colors.primary}
                  showPercentage={false}
                />
              </Animated.View>
              <Text style={styles.progressPercentage}>
                {Math.round(activity.progress.percentage)}%
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons (Teacher View) */}
        {isTeacherView && !isCompleted && (
          <View style={styles.actionButtons}>
            {activity.status === 'scheduled' && onStartActivity && (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={onStartActivity}
              >
                <PlayCircle size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Start Activity</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => setShowDetails(true)}
            >
              <Info size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPreviewCard = () => (
    <TouchableOpacity
      style={styles.previewCard}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.previewColorBar, { backgroundColor: activityConfig.color }]} />
      <View style={styles.previewContent}>
        <Icon size={32} color={activityConfig.color} />
        <Text style={styles.previewTitle}>{activity.title}</Text>
        <Text style={styles.previewDuration}>{activity.duration} minutes</Text>
        <View style={styles.previewKmap}>
          {Object.entries(activity.kmapDimensions)
            .filter(([, value]) => value > 0)
            .map(([dim]) => {
              const DimIcon = DIMENSION_CONFIG[dim as keyof typeof DIMENSION_CONFIG].icon;
              return <DimIcon key={dim} size={16} color={colors.gray600} />;
            })}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Activity Details</Text>
          <TouchableOpacity onPress={() => setShowDetails(false)}>
            <Text style={styles.modalClose}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Full activity details would go here */}
          <Text style={styles.modalSectionTitle}>Instructions</Text>
          <Text style={styles.modalText}>
            {activity.instructions || 'No specific instructions provided.'}
          </Text>
          
          {activity.materials && activity.materials.length > 0 && (
            <>
              <Text style={styles.modalSectionTitle}>Materials Needed</Text>
              {activity.materials.map((material, index) => (
                <View key={index} style={styles.materialItem}>
                  <Circle size={6} color={colors.gray400} />
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      {variant === 'compact' && renderCompactCard()}
      {variant === 'default' && renderDefaultCard()}
      {variant === 'preview' && renderPreviewCard()}
      {variant === 'detailed' && (
        <View style={styles.detailedWrapper}>
          {renderDefaultCard()}
          {/* Additional detailed content */}
        </View>
      )}
      {renderDetailsModal()}
    </>
  );
}

const styles = {
  // Skeleton styles
  skeletonCard: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  
  // Default card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  completedCard: {
    backgroundColor: colors.gray50,
    opacity: 0.9,
  },
  disabledCard: {
    opacity: 0.5,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
    position: 'relative' as const,
  },
  liveIndicator: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    flex: 1,
  },
  completedText: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  milestoneBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  milestoneBadgeText: {
    fontSize: typography.xs,
    color: colors.warning,
    fontWeight: typography.medium as any,
  },
  activityTypeLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  difficultyContainer: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  description: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  mediaBadges: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  mediaBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  mediaBadgeText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  
  // K-Map styles
  kmapSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  kmapHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  kmapTitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
  },
  balanceScore: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  balanceScoreText: {
    fontSize: typography.xs,
    color: colors.primary,
  },
  kmapBars: {
    gap: spacing.sm,
  },
  kmapItem: {
    marginBottom: spacing.xs,
  },
  kmapLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  kmapLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  kmapValue: {
    fontSize: typography.xs,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
  },
  kmapBarContainer: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  kmapBar: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Objectives styles
  objectivesSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  objectiveItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  objectiveText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  moreText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontStyle: 'italic' as const,
  },
  
  // Progress styles
  progressSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  progressStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  progressBarWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  animatedProgressBar: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.primary,
    minWidth: 35,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    flex: 1,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  detailsButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.white,
  },
  
  // Compact card styles
  compactCard: {
    backgroundColor: colors.white,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  compactLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: spacing.sm,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: typography.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  compactMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  compactMetaText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  compactAction: {
    padding: spacing.xs,
  },
  
  // Preview card styles
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    width: 160,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  previewColorBar: {
    height: 4,
    width: '100%',
  },
  previewContent: {
    padding: spacing.md,
    alignItems: 'center' as const,
  },
  previewTitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  previewDuration: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  previewKmap: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
  },
  
  // Detailed wrapper
  detailedWrapper: {
    marginBottom: spacing.lg,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: typography.base,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  materialItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  materialText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
};