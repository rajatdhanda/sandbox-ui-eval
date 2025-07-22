// app/components/teacher/class-progress-view.tsx
// Path: app/components/teacher/class-progress-view.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import {
  TrendingUp,
  Users,
  Award,
  Calendar,
  Filter,
  Download,
  ChevronRight,
  BarChart3,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Heart,
  Target,
  Eye
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

// ✅ FIXED: Using shared components
import { ProgressTimeline } from '@/app/components/shared/progress-timeline';
import { KMapRadarChart } from '@/app/components/shared/kmap-radar-chart';
import { StudentProgressGrid } from '@/app/components/shared/student-progress-grid';
import { StatCards } from '@/app/components/shared/stat-cards';
import { TabNavigation } from '@/app/components/shared/tab-navigation';
import { SmartSelector } from '@/app/components/shared/selection-components';
import { ProgressBar, DimensionPills } from '@/app/components/shared/progress-components';
import { DateWeekSelector } from '@/app/components/shared/date-time-controls';
import { ScrollableContainer } from '@/app/components/shared/scrollable-container';
import { EmptyState } from '@/app/components/shared/empty-state';
import { TeacherActivityCard } from '@/app/components/shared/teacher-activity-card';

// ✅ FIXED: Remove DataService import - use hooks only
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { useKMapAnalytics } from '@/hooks/use-kmap-analytics';
import { useLearningTracking } from '@/hooks/use-learning-tracking';
import { useMilestoneTracking } from '@/hooks/use-milestone-tracking';
import { useEntityOptions } from '@/hooks/use-entity-options';
import { useCrud } from '@/hooks/use-crud';

const { width: screenWidth } = Dimensions.get('window');

interface ClassProgressViewProps {
  classId: string;
  className?: string;
  onStudentSelect?: (studentId: string) => void;
  onExport?: (data: any) => void;
  onActivityPress?: (activity: any) => void;
}

export function ClassProgressView({
  classId,
  className = 'Class',
  onStudentSelect,
  onExport,
  onActivityPress
}: ClassProgressViewProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'trends' | 'achievements'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'term'>('week');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDimension, setFilterDimension] = useState<'all' | 'move' | 'think' | 'endure'>('all');
  
  // ✅ FIXED: Using hooks for data
  const { childOptions, loading: loadingChildren } = useEntityOptions({ children: true });
  const { calculateChildKMap, compareToClassAverage } = useKMapAnalytics();
  const { getMilestoneProgress } = useMilestoneTracking();
  const { getChildLearningTrends } = useLearningTracking();
  
  // Filter children for this class
  const classChildren = useMemo(() => {
    return childOptions.filter(child => child.metadata?.classId === classId);
  }, [childOptions, classId]);

  // Calculate class analytics
  const classAnalytics = useMemo(() => {
    if (!classChildren.length) return null;

    // Calculate average K-Map scores
    const totalScores = { move: 0, think: 0, endure: 0 };
    let validScoreCount = 0;

    classChildren.forEach(child => {
      if (child.metadata?.kmapScores) {
        totalScores.move += child.metadata.kmapScores.move || 0;
        totalScores.think += child.metadata.kmapScores.think || 0;
        totalScores.endure += child.metadata.kmapScores.endure || 0;
        validScoreCount++;
      }
    });

    if (validScoreCount === 0) return null;

    return {
      averageKMap: {
        move: Math.round(totalScores.move / validScoreCount),
        think: Math.round(totalScores.think / validScoreCount),
        endure: Math.round(totalScores.endure / validScoreCount)
      },
      totalChildren: classChildren.length,
      activeChildren: classChildren.filter(c => c.metadata?.isActive).length
    };
  }, [classChildren]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here
    setRefreshing(false);
  };

  // Export handler
  const handleExport = () => {
    const exportData = {
      className,
      date: new Date().toISOString(),
      children: classChildren,
      analytics: classAnalytics,
      timeframe: selectedTimeframe
    };
    onExport?.(exportData);
  };

  // Tab configuration
  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'individual', label: 'Individual', icon: Users },
    { key: 'trends', label: 'Trends', icon: TrendingUp },
    { key: 'achievements', label: 'Achievements', icon: Award }
  ];

  // Stats for overview
  const overviewStats = [
    {
      icon: <Users size={24} color={colors.primary} />,
      value: classChildren.length,
      label: 'Students'
    },
    {
      icon: <Target size={24} color={colors.success} />,
      value: classAnalytics?.averageKMap.move || 0,
      label: 'Avg Move'
    },
    {
      icon: <Brain size={24} color={colors.info} />,
      value: classAnalytics?.averageKMap.think || 0,
      label: 'Avg Think'
    },
    {
      icon: <Heart size={24} color={colors.warning} />,
      value: classAnalytics?.averageKMap.endure || 0,
      label: 'Avg Endure'
    }
  ];

  return (
    <ScrollableContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{className} Progress</Text>
          <Text style={styles.subtitle}>Track student development</Text>
        </View>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Download size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Time Frame Selector */}
      <View style={styles.timeframeSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['week', 'month', 'term'] as const).map(timeframe => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.timeframeTextActive
              ]}>
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content based on active tab */}
      {loadingChildren ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading class data...</Text>
        </View>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              <StatCards stats={overviewStats} />
              
              {classAnalytics && (
                <>
                  <Text style={styles.sectionTitle}>Class K-Map Balance</Text>
                  <View style={styles.chartContainer}>
                    <KMapRadarChart
                      scores={classAnalytics.averageKMap}
                      size={250}
                      showBalance={true}
                    />
                  </View>
                </>
              )}

              {/* Dimension Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Filter by Dimension:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(['all', 'move', 'think', 'endure'] as const).map(dimension => (
                    <TouchableOpacity
                      key={dimension}
                      style={[
                        styles.filterButton,
                        filterDimension === dimension && styles.filterButtonActive
                      ]}
                      onPress={() => setFilterDimension(dimension)}
                    >
                      <Text style={[
                        styles.filterText,
                        filterDimension === dimension && styles.filterTextActive
                      ]}>
                        {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Student Grid */}
              <StudentProgressGrid
                students={classChildren.map(child => ({
                  id: child.id,
                  name: child.label,
                  ...child.metadata
                }))}
                onStudentPress={(student) => {
                  setSelectedStudent(student.id);
                  setActiveTab('individual');
                  onStudentSelect?.(student.id);
                }}
                showFilters={false}
                view="grid"
              />
            </View>
          )}

          {/* Individual Tab */}
          {activeTab === 'individual' && (
            <View style={styles.individualContainer}>
              {selectedStudent ? (
                <>
                  <SmartSelector
                    options={classChildren}
                    value={selectedStudent}
                    onChange={setSelectedStudent}
                    placeholder="Select a student"
                  />
                  <ProgressTimeline
                    childId={selectedStudent}
                    dateRange={selectedTimeframe}
                    showMilestones={true}
                    onItemPress={(item) => onActivityPress?.(item)}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<Users size={48} color={colors.gray400} />}
                  title="Select a Student"
                  subtitle="Choose a student to view their individual progress"
                />
              )}
            </View>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <View style={styles.trendsContainer}>
              <Text style={styles.sectionTitle}>Class Trends</Text>
              
              {/* K-Map Trends */}
              <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendTitle}>K-Map Development</Text>
                  <View style={styles.trendIndicator}>
                    <TrendingUp size={16} color={colors.success} />
                    <Text style={[styles.trendValue, { color: colors.success }]}>+15%</Text>
                  </View>
                </View>
                <Text style={styles.trendDesc}>
                  Overall improvement across all dimensions this {selectedTimeframe}
                </Text>
                <DimensionPills
                  dimensions={{ move: 3, think: 2, endure: 4 }}
                  size="md"
                />
              </View>

              {/* Top Activities */}
              <View style={styles.topActivitiesSection}>
                <Text style={styles.sectionTitle}>Most Effective Activities</Text>
                {/* Activity list would go here */}
                <EmptyState
                  title="Activity Analysis"
                  subtitle="Activity effectiveness data will appear here"
                />
              </View>
            </View>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <View style={styles.achievementsContainer}>
              <View style={styles.milestoneSummary}>
                <Text style={styles.sectionTitle}>Class Milestones</Text>
                <View style={styles.milestoneStats}>
                  <View style={styles.milestoneStat}>
                    <Text style={styles.milestoneCount}>23</Text>
                    <Text style={styles.milestoneLabel}>Achieved</Text>
                  </View>
                  <View style={styles.milestoneStat}>
                    <Text style={[styles.milestoneCount, { color: colors.warning }]}>12</Text>
                    <Text style={styles.milestoneLabel}>In Progress</Text>
                  </View>
                  <View style={styles.milestoneStat}>
                    <Text style={[styles.milestoneCount, { color: colors.gray400 }]}>8</Text>
                    <Text style={styles.milestoneLabel}>Upcoming</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Recent Achievements</Text>
              <View style={styles.achievementsGrid}>
                {/* Achievement items would go here */}
                <View style={styles.achievementItem}>
                  <Award size={32} color={colors.warning} />
                  <Text style={styles.achievementName}>First Steps</Text>
                </View>
                <View style={styles.achievementItem}>
                  <Zap size={32} color={colors.primary} />
                  <Text style={styles.achievementName}>Speed Star</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollableContainer>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold as any,
    color: colors.gray900,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  exportButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  timeframeSection: {
    marginBottom: spacing.lg,
  },
  timeframeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: typography.sm,
    color: colors.gray700,
  },
  timeframeTextActive: {
    color: colors.white,
    fontWeight: typography.semibold as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    color: colors.gray600,
  },
  overviewContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.gray900,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  filterSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.sm,
    color: colors.gray700,
  },
  filterTextActive: {
    color: colors.white,
  },
  individualContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  trendsContainer: {
    flex: 1,
  },
  trendCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  trendHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  trendTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium as any,
    color: colors.gray900,
  },
  trendIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  trendValue: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
  },
  trendDesc: {
    fontSize: typography.xs,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  topActivitiesSection: {
    marginTop: spacing.xl,
  },
  achievementsContainer: {
    flex: 1,
  },
  milestoneSummary: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  milestoneStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginTop: spacing.md,
  },
  milestoneStat: {
    alignItems: 'center' as const,
  },
  milestoneCount: {
    fontSize: typography.xxl,
    fontWeight: typography.bold as any,
    color: colors.gray900,
  },
  milestoneLabel: {
    fontSize: typography.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  achievementsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
  },
  achievementItem: {
    width: (screenWidth - spacing.md * 3) / 2,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    ...shadows.sm,
  },
  achievementName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.gray900,
    marginTop: spacing.sm,
  },
};