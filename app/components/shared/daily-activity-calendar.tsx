// app/components/shared/daily-activity-calendar.tsx
// Path: app/components/shared/daily-activity-calendar.tsx
// Enhanced teacher's daily activity view with advanced features

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, 
  Alert, Animated, RefreshControl, FlatList, SectionList 
} from 'react-native';
import { 
  Calendar, Clock, Users, CheckCircle2, Circle, Camera, 
  FileText, ChevronRight, AlertCircle, RefreshCw, Filter,
  TrendingUp, Award, Zap, Brain, Heart, BarChart3,
  PlayCircle, PauseCircle, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows, commonStyles } from '@/lib/styles';
import { DateWeekSelector } from './date-time-controls';
import { StatusBadge } from './crud-components';
import { DimensionPills, ProgressBar } from './progress-components';
import { useTeacherDailyActivities } from '@/hooks/use-teacher-daily-activities';

interface DailyActivityCalendarProps {
  classId: string;
  onActivityPress?: (activity: any) => void;
  onQuickNote?: (activityId: string, childId?: string) => void;
  onPhotoUpload?: (activityId: string) => void;
  showTimeSlots?: boolean;
  compactMode?: boolean;
}

interface FilterOptions {
  status: 'all' | 'scheduled' | 'in_progress' | 'completed';
  activityType: string | 'all';
  showOnlyMilestones: boolean;
}

const ACTIVITY_ICONS: Record<string, any> = {
  'circle_time': Users,
  'outdoor_play': Zap,
  'story_time': FileText,
  'art_craft': Brain,
  'music_movement': Heart,
};

export function DailyActivityCalendar({ 
  classId, 
  onActivityPress,
  onQuickNote,
  onPhotoUpload,
  showTimeSlots = true,
  compactMode = false
}: DailyActivityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    activityType: 'all',
    showOnlyMilestones: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const formatTimeSlot = (start: string, end: string) => {
    return `${start} - ${end}`;
  };
  
  const { 
    activities, 
    loading, 
    error, 
    markClassComplete, 
    markIndividualComplete,
    refresh,
    activitySummary,
    loadTodaySchedule 
  } = useTeacherDailyActivities(classId, selectedDate);

  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    if (filters.status !== 'all' && activity.status !== filters.status) return false;
    if (filters.activityType !== 'all' && activity.curriculum_item?.activity_type !== filters.activityType) return false;
    if (filters.showOnlyMilestones && !activity.hasMilestoneAchieved) return false;
    return true;
  });

  // Ensure we have real data structure
  console.log('[DailyCalendar] Activities loaded:', activities.length);

  // Group activities by time with better structure
  // Group activities by time with better structure
  const activitiesByTime = filteredActivities.reduce((acc, activity) => {
    const time = activity.scheduled_time || '09:00';
    const timeKey = formatTimeSlot(time, activity.end_time || '09:30');
    
    if (!acc[timeKey]) {
      acc[timeKey] = {
        title: timeKey,
        data: [],
        startTime: time,
        totalDuration: 0,
        completedCount: 0
      };
    }
    
    acc[timeKey].data.push(activity);
    acc[timeKey].totalDuration += activity.curriculum_item?.duration_minutes || 30;
    if (activity.status === 'completed' || activity.progress?.percentage === 100) {
      acc[timeKey].completedCount++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const sections = Object.values(activitiesByTime).sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  // Auto-detect current activity based on time
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const current = activities.find(activity => {
      const start = activity.scheduled_time || '';
      const end = activity.end_time || '';
      return start <= currentTime && currentTime <= end && activity.status !== 'completed';
    });
    
    if (current) {
      setCurrentActivityId(current.id);
      startPulseAnimation();
    }
  }, [activities]);

  // Animations
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateActivityComplete = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMarkComplete = async (activityId: string) => {
    Alert.alert(
      'Mark Activity Complete',
      'This will mark the activity as complete for all present children. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            const result = await markClassComplete(activityId);
            if (result.success) {
              animateActivityComplete();
              Alert.alert('Success', 'Activity marked as complete');
            } else {
              Alert.alert('Error', result.error || 'Failed to mark activity complete');
            }
          }
        }
      ]
    );
  };

  const handleMarkChildComplete = async (activityId: string, childId: string) => {
    const result = await markIndividualComplete(activityId, childId, {
      participationLevel: 'full',
      engagementScore: 4,
      skillDemonstration: 'developing'
    });
    
    if (result.success) {
      // Quick haptic feedback would go here
    } else {
      Alert.alert('Error', result.error || 'Failed to update progress');
    }
  };

  const handleStartActivity = (activityId: string) => {
  setCurrentActivityId(activityId);
  console.log('Activity started:', activityId);
  // Update the status locally for immediate UI feedback
  const updatedActivities = activities.map(act => 
    act.id === activityId ? { ...act, status: 'in_progress' } : act
  );
  // The actual update will happen through the hook
  refresh();
};



  const getActivityTypeColor = (type: string) => {
    const colors = {
      'circle_time': '#FF6B6B',
      'outdoor_play': '#4ECDC4',
      'story_time': '#45B7D1',
      'art_craft': '#96CEB4',
      'music_movement': '#DDA0DD',
    };
    return colors[type] || '#95A5A6';
  };

  const renderActivityCard = ({ item: activity }: { item: any }) => {
    const isExpanded = expandedActivity === activity.id;
    const progressPercentage = activity.progress?.percentage || 0;
    const isCompleted = activity.status === 'completed' || progressPercentage === 100;
    const isCurrentActivity = currentActivityId === activity.id;
    const Icon = ACTIVITY_ICONS[activity.curriculum_item?.activity_type] || Calendar;
    
    return (
      <Animated.View
        style={[
          { 
            opacity: fadeAnim,
            transform: isCurrentActivity ? [{ scale: pulseAnim }] : []
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.activityCard, 
            isCompleted && styles.completedCard,
            isCurrentActivity && styles.currentActivityCard
          ]}
          onPress={() => setExpandedActivity(isExpanded ? null : activity.id)}
          activeOpacity={0.7}
        >
          {/* Current Activity Indicator */}
          {isCurrentActivity && (
            <View style={styles.currentIndicator}>
              <PlayCircle size={16} color={colors.white} />
              <Text style={styles.currentText}>NOW</Text>
            </View>
          )}

          {/* Activity Header */}
          <View style={styles.activityHeader}>
            <View style={styles.activityIcon}>
              <Icon 
                size={24} 
                color={getActivityTypeColor(activity.curriculum_item?.activity_type)} 
              />
            </View>
            
            <View style={styles.activityInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.activityTitle, isCompleted && styles.completedText]}>
                  {activity.curriculum_item?.title || 'Untitled Activity'}
                </Text>
                {activity.hasMilestoneAchieved && (
                  <Award size={16} color={colors.warning} style={styles.milestoneIcon} />
                )}
              </View>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.gray500} />
                  <Text style={styles.metaText}>
                    {activity.curriculum_item?.duration_minutes || 30} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Users size={14} color={colors.gray500} />
                  <Text style={styles.metaText}>
                    {activity.progress?.completed || 0}/{activity.progress?.total || 0}
                  </Text>
                </View>
                {activity.averageEngagement && (
                  <View style={styles.metaItem}>
                    <TrendingUp size={14} color={colors.success} />
                    <Text style={styles.metaText}>
                      {activity.averageEngagement.toFixed(1)}/5
                    </Text>
                  </View>
                )}
              </View>

              {/* K-Map Dimensions */}
              {activity.curriculum_item?.kmap_dimensions && !compactMode && (
                <View style={styles.kmapContainer}>
                  <DimensionPills
                    dimensions={activity.curriculum_item.kmap_dimensions}
                    size="sm"
                    showZero={false}
                  />
                </View>
              )}
            </View>
            
            <ChevronRight 
              size={20} 
              color={colors.gray400}
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <ProgressBar
              current={activity.progress?.completed || 0}
              total={activity.progress?.total || 0}
              showPercentage
              height={6}
              animated
              color={isCompleted ? colors.success : colors.primary}
            />
          </View>

          {/* Quick Actions */}
          {/* Quick Actions */}
<View style={styles.quickActions}>
  {!isCompleted && activity.status === 'scheduled' && (
    <TouchableOpacity
      style={[styles.actionButton, styles.startButton]}
      onPress={() => {
        handleStartActivity(activity.id);
        // Visual feedback
        animateActivityComplete();
      }}
    >
      <PlayCircle size={16} color={colors.white} />
      <Text style={styles.actionButtonText}>Start</Text>
    </TouchableOpacity>
  )}
  
  <TouchableOpacity
    style={[styles.actionButton, styles.secondaryButton]}
    onPress={() => {
      onQuickNote?.(activity.id);
      // Visual feedback
      animateActivityComplete();
    }}
  >
    <FileText size={16} color={colors.primary} />
    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Note</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[styles.actionButton, styles.secondaryButton]}
    onPress={() => {
      onPhotoUpload?.(activity.id);
      // Visual feedback
      animateActivityComplete();
    }}
  >
    <Camera size={16} color={colors.primary} />
    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Photo</Text>
  </TouchableOpacity>
</View>

{/* Complete Button - Separate Row */}
{!isCompleted && (activity.status === 'in_progress' || isCurrentActivity) && (
  <TouchableOpacity
    style={[styles.completeButtonFull]}
    onPress={() => handleMarkComplete(activity.id)}
  >
    <CheckCircle2 size={16} color={colors.white} />
    <Text style={styles.completeButtonText}>Mark Activity Complete</Text>
  </TouchableOpacity>
)}

          {/* Expanded Children List */}
          {isExpanded && activity.children && (
            <Animated.View 
              style={[
                styles.childrenList,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.childrenHeader}>Individual Progress</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activity.children.map((child: any) => (
                  <View key={child.child_id} style={styles.childCard}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childInitial}>
                        {child.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.childName} numberOfLines={1}>
                      {child.name.split(' ')[0]}
                    </Text>
                    {child.attendance === 'absent' ? (
                      <Text style={styles.absentText}>Absent</Text>
                    ) : child.progress_status === 'completed' ? (
                      <CheckCircle2 size={20} color={colors.success} />
                    ) : (
                      <TouchableOpacity
                        style={styles.childCompleteButton}
                        onPress={() => handleMarkChildComplete(activity.id, child.child_id)}
                      >
                        <Circle size={20} color={colors.gray400} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTimeSection = ({ section }: { section: any }) => (
    <View style={styles.timeSection}>
      <View style={styles.timeSectionHeader}>
        <Text style={styles.timeLabel}>{section.title}</Text>
        <View style={styles.timeSectionMeta}>
          <Text style={styles.timeSectionMetaText}>
            {section.completedCount}/{section.data.length} done
          </Text>
          <Text style={styles.timeSectionMetaText}>•</Text>
          <Text style={styles.timeSectionMetaText}>
            {section.totalDuration} min total
          </Text>
        </View>
      </View>
    </View>
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (loading && activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Navigation */}
      <View style={styles.dateNavContainer}>
        <DateWeekSelector 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary} />
          {(filters.status !== 'all' || filters.activityType !== 'all' || filters.showOnlyMilestones) && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <Animated.View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.status === 'all' && styles.filterChipActive
              ]}
              onPress={() => setFilters({ ...filters, status: 'all' })}
            >
              <Text style={[
                styles.filterChipText,
                filters.status === 'all' && styles.filterChipTextActive
              ]}>All Status</Text>
            </TouchableOpacity>
            
            {['scheduled', 'in_progress', 'completed'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filters.status === status && styles.filterChipActive
                ]}
                onPress={() => setFilters({ ...filters, status: status as any })}
              >
                <Text style={[
                  styles.filterChipText,
                  filters.status === status && styles.filterChipTextActive
                ]}>{status.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.showOnlyMilestones && styles.filterChipActive
              ]}
              onPress={() => setFilters({ ...filters, showOnlyMilestones: !filters.showOnlyMilestones })}
            >
              <Award size={14} color={filters.showOnlyMilestones ? colors.white : colors.gray600} />
              <Text style={[
                styles.filterChipText,
                filters.showOnlyMilestones && styles.filterChipTextActive
              ]}>Milestones</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
      
      {/* Summary Stats */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{activitySummary.total}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {activitySummary.completed}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>In Progress</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {activitySummary.inProgress || 0}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.info }]}>
            {activitySummary.pending}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Activities List */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredActivities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={colors.gray400} />
          <Text style={styles.emptyText}>
            {filters.status !== 'all' || filters.activityType !== 'all' 
              ? 'No activities match your filters'
              : 'No activities scheduled'}
          </Text>
          {filters.status !== 'all' && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({ status: 'all', activityType: 'all', showOnlyMilestones: false })}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : showTimeSlots ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityCard}
          renderSectionHeader={renderTimeSection}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing['2xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  dateNavContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterButton: {
    padding: spacing.sm,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filterChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  summaryBar: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center' as const,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.xl,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
  },
  errorText: {
    marginLeft: spacing.sm,
    color: colors.error,
    flex: 1,
  },
  retryText: {
    color: colors.primary,
    fontWeight: typography.medium as any,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    marginTop: spacing.lg,
    fontSize: typography.lg,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  clearFiltersButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  clearFiltersText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
  timeSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  timeSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  timeLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
  },
  timeSectionMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  timeSectionMetaText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.sm,
    position: 'relative' as const,
  },
  completedCard: {
    backgroundColor: colors.gray50,
    opacity: 0.8,
  },
  currentActivityCard: {
  borderWidth: 2,
  borderColor: colors.primary,
  paddingTop: spacing.lg,  // Add extra padding for the NOW badge
},
  currentIndicator: {
    position: 'absolute' as const,
    top: -1,
    right: -1,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  currentText: {
    fontSize: typography.xs,
    fontWeight: typography.bold as any,
    color: colors.white,
  },
  activityHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  activityTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    flex: 1,
  },
  completedText: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  milestoneIcon: {
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row' as const,
    gap: spacing.lg,
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
  kmapContainer: {
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  quickActions: {
  flexDirection: 'row' as const,
  gap: spacing.sm,
  marginTop: spacing.md,
  justifyContent: 'space-between' as const,
},
  actionButton: {
  flex: 1,  // Make buttons equal width
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,  // Center content
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.md,
  gap: spacing.xs,
  minHeight: 40,
},
startButton: {
  backgroundColor: colors.info,
},
completeButton: {
  backgroundColor: colors.success,
  flex: 1,
  justifyContent: 'center' as const,
},
completeButtonFull: {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: colors.success,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: borderRadius.md,
  gap: spacing.sm,
  marginTop: spacing.md,
},
completeButtonText: {
  fontSize: typography.sm,
  fontWeight: typography.medium as any,
  color: colors.white,
},


  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  actionButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.white,
  },
  childrenList: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  childrenHeader: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  childCard: {
    alignItems: 'center' as const,
    marginRight: spacing.md,
    minWidth: 80,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.xs,
  },
  childInitial: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.primary,
  },
  childName: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  absentText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  childCompleteButton: {
    padding: spacing.xs,
  },
  modalOverlay: {
  position: 'absolute' as any,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center' as any,
  alignItems: 'center' as any,
  zIndex: 1000,  // Add this to ensure modal appears on top
},
};