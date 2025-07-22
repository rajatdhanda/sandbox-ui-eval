// app/components/shared/student-progress-grid.tsx
import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  Image,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  AccessibilityInfo,
  StyleSheet
} from 'react-native';
import { 
  User, TrendingUp, TrendingDown, Minus, 
  Award, AlertCircle, Clock, CheckCircle2,
  ChevronRight, Filter, Grid3x3, List,
  Star, Zap, Brain, Heart, Search,
  Calendar, BarChart3, Sparkles, FileText,
  MoreVertical, Camera, PenTool
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';
import { ProgressBar } from './progress-components';
import type { KMapScores } from '@/app/components/shared/type/data-service.types';

// Complete interface with ALL fields from original
interface StudentProgress {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  // Support database field naming conventions
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  attendance: {
    present: boolean;
    status: 'present' | 'absent' | 'late' | 'excused';
    arrivalTime?: string;
  };
  dailyProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  weeklyProgress?: {
    percentage: number;
    trend: number; // percentage change
  };
  kmapScores: KMapScores;
  previousKmapScores?: KMapScores;
  trend: 'improving' | 'stable' | 'declining';
  recentMilestone?: {
    title: string;
    achievedAt: string;
  };
  needsAttention?: boolean;
  attentionReason?: string;
  lastActivity?: {
    name: string;
    completedAt: string;
    score?: number;
  };
  engagementLevel?: 'high' | 'medium' | 'low';
  notes?: number; // count of notes
}

interface StudentProgressGridProps {
  students: StudentProgress[];
  view?: 'grid' | 'list';
  onStudentPress?: (student: StudentProgress) => void;
  onQuickAction?: (student: StudentProgress, action: string) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  groupBy?: 'none' | 'attendance' | 'progress' | 'attention';
}

// Constants
const DIMENSION_ICONS = {
  move: Zap,
  think: Brain,
  endure: Heart
} as const;

const DIMENSION_COLORS = {
  move: colors.error,
  think: colors.warning,
  endure: colors.success
} as const;

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.md * 3) / 2;

// Helper to transform database records to component format
export const transformStudentData = (dbStudent: any): StudentProgress => {
  return {
    id: dbStudent.id,
    firstName: dbStudent.first_name || dbStudent.firstName,
    lastName: dbStudent.last_name || dbStudent.lastName,
    photoUrl: dbStudent.photo_url || dbStudent.photoUrl,
    attendance: dbStudent.attendance || {
      present: true,
      status: 'present'
    },
    dailyProgress: dbStudent.daily_progress || dbStudent.dailyProgress || {
      completed: 0,
      total: 0,
      percentage: 0
    },
    weeklyProgress: dbStudent.weekly_progress || dbStudent.weeklyProgress,
    kmapScores: dbStudent.kmap_scores || dbStudent.kmapScores || {
      move: 0,
      think: 0,
      endure: 0
    },
    previousKmapScores: dbStudent.previous_kmap_scores || dbStudent.previousKmapScores,
    trend: dbStudent.trend || 'stable',
    recentMilestone: dbStudent.recent_milestone || dbStudent.recentMilestone,
    needsAttention: dbStudent.needs_attention || dbStudent.needsAttention || false,
    attentionReason: dbStudent.attention_reason || dbStudent.attentionReason,
    lastActivity: dbStudent.last_activity || dbStudent.lastActivity,
    engagementLevel: dbStudent.engagement_level || dbStudent.engagementLevel,
    notes: dbStudent.notes
  };
};

// Separate component for student card to fix hooks violation
const StudentCard = memo(({ 
  student, 
  onPress, 
  onQuickAction,
  fadeAnim, 
  scaleAnim 
}: {
  student: StudentProgress;
  onPress?: () => void;
  onQuickAction?: (action: string) => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Proper hook usage at component level
  useEffect(() => {
    if (student.needsAttention) {
      animationRef.current = Animated.loop(
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
      );
      animationRef.current.start();
    }
    
    return () => {
      animationRef.current?.stop();
    };
  }, [student.needsAttention, pulseAnim]);

  const dominantDim = useMemo(() => {
    const entries = Object.entries(student.kmapScores) as [keyof KMapScores, number][];
    const [dimension] = entries.sort(([, a], [, b]) => b - a)[0];
    return dimension;
  }, [student.kmapScores]);

  const kmapChanges = useMemo(() => {
    if (!student.previousKmapScores) return null;
    
    return {
      move: student.kmapScores.move - student.previousKmapScores.move,
      think: student.kmapScores.think - student.previousKmapScores.think,
      endure: student.kmapScores.endure - student.previousKmapScores.endure
    };
  }, [student.kmapScores, student.previousKmapScores]);

  const handleQuickAction = useCallback((action: string) => {
    onQuickAction?.(action);
  }, [onQuickAction]);

  return (
    <Animated.View
      style={[
        { 
          opacity: fadeAnim,
          transform: [
            { scale: student.needsAttention ? pulseAnim : scaleAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.gridCard,
          !student.attendance.present && styles.absentCard,
          student.needsAttention && styles.attentionCard
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${student.firstName} ${student.lastName}, ${student.dailyProgress.percentage}% progress`}
        accessibilityHint="Tap to view student details"
      >
        {/* Quick Actions Menu */}
        {onQuickAction && (
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('menu')}
            accessible={true}
            accessibilityLabel="Quick actions menu"
          >
            <MoreVertical size={16} color={colors.gray600} />
          </TouchableOpacity>
        )}

        {/* Status Indicators */}
        <View style={styles.statusIndicators}>
          {student.needsAttention && (
            <View style={styles.attentionBadge}>
              <AlertCircle size={16} color={colors.warning} />
            </View>
          )}
          {student.recentMilestone && (
            <View style={styles.milestoneBadge}>
              <Award size={16} color={colors.primary} />
            </View>
          )}
          {student.lastActivity && (
            <View style={styles.activityBadge}>
              <Clock size={12} color={colors.gray600} />
            </View>
          )}
        </View>

        {/* Student Photo/Avatar */}
        <View style={styles.avatarContainer}>
          {student.photoUrl ? (
            <Image 
              source={{ uri: student.photoUrl }} 
              style={styles.avatar}
              accessibilityLabel={`${student.firstName}'s photo`}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: DIMENSION_COLORS[dominantDim] + '20' }]}>
              <Text style={[styles.avatarInitials, { color: DIMENSION_COLORS[dominantDim] }]}>
                {student.firstName[0]}{student.lastName[0]}
              </Text>
            </View>
          )}
          {!student.attendance.present && (
            <View style={styles.attendanceBadge}>
              <Text style={styles.attendanceText}>
                {student.attendance.status === 'absent' ? 'A' : 'L'}
              </Text>
            </View>
          )}
          {student.engagementLevel && (
            <View style={[
              styles.engagementIndicator, 
              { backgroundColor: getEngagementColor(student.engagementLevel) }
            ]} />
          )}
        </View>

        {/* Student Name */}
        <Text style={styles.studentName} numberOfLines={1}>
          {student.firstName} {student.lastName[0]}.
        </Text>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today</Text>
            {student.weeklyProgress && (
              <View style={styles.weeklyTrend}>
                <Text style={styles.weeklyTrendText}>
                  {student.weeklyProgress.trend >= 0 ? '+' : ''}{student.weeklyProgress.trend}%
                </Text>
              </View>
            )}
          </View>
          <ProgressBar 
            progress={student.dailyProgress.percentage / 100}
            height={6}
            color={student.attendance.present ? colors.primary : colors.gray400}
            animated
          />
          <Text style={styles.progressText}>
            {student.dailyProgress.completed}/{student.dailyProgress.total}
          </Text>
        </View>

        {/* K-Map Visualization */}
        <View style={styles.kmapSection}>
          <View style={styles.kmapBars}>
            {(Object.entries(student.kmapScores) as [keyof KMapScores, number][]).map(([dim, score]) => {
              const Icon = DIMENSION_ICONS[dim];
              const change = kmapChanges?.[dim];
              
              return (
                <View key={dim} style={styles.kmapItem}>
                  <View style={styles.kmapBarContainer}>
                    <View 
                      style={[
                        styles.kmapBar, 
                        { 
                          height: `${Math.min((score / 10) * 100, 100)}%`,
                          backgroundColor: DIMENSION_COLORS[dim]
                        }
                      ]} 
                    />
                  </View>
                  <Icon size={12} color={DIMENSION_COLORS[dim]} />
                  {change !== null && change !== undefined && change !== 0 && (
                    <Text style={[
                      styles.kmapChange,
                      { color: change > 0 ? colors.success : colors.error }
                    ]}>
                      {change > 0 ? '+' : ''}{change}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom Info */}
        <View style={styles.cardFooter}>
          <View style={styles.trendContainer}>
            {getTrendIcon(student.trend)}
          </View>
          <View style={styles.footerRight}>
            {student.notes !== undefined && student.notes > 0 && (
              <View style={styles.notesIndicator}>
                <FileText size={12} color={colors.gray600} />
                <Text style={styles.notesCount}>{student.notes}</Text>
              </View>
            )}
            {/* Quick Action Buttons */}
            {onQuickAction && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  onPress={() => handleQuickAction('camera')}
                  style={styles.miniActionButton}
                  accessible={true}
                  accessibilityLabel="Take photo"
                >
                  <Camera size={14} color={colors.gray600} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuickAction('note')}
                  style={styles.miniActionButton}
                  accessible={true}
                  accessibilityLabel="Add note"
                >
                  <PenTool size={14} color={colors.gray600} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Last Activity (if exists) */}
        {student.lastActivity && (
          <View style={styles.lastActivityContainer}>
            <Text style={styles.lastActivityText} numberOfLines={1}>
              {student.lastActivity.name}
            </Text>
            {student.lastActivity.score && (
              <View style={styles.activityScore}>
                <Star size={10} color={colors.warning} />
                <Text style={styles.scoreText}>{student.lastActivity.score}</Text>
              </View>
            )}
          </View>
        )}

        {/* Attention Reason (if exists) */}
        {student.attentionReason && (
          <Text style={styles.attentionReason} numberOfLines={2}>
            {student.attentionReason}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

StudentCard.displayName = 'StudentCard';

// Helper functions
const getEngagementColor = (level?: string): string => {
  switch (level) {
    case 'high': return colors.success;
    case 'medium': return colors.warning;
    case 'low': return colors.error;
    default: return colors.gray400;
  }
};

const getTrendIcon = (trend: StudentProgress['trend']) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={16} color={colors.success} />;
    case 'declining':
      return <TrendingDown size={16} color={colors.error} />;
    default:
      return <Minus size={16} color={colors.gray500} />;
  }
};

// Group header component
const GroupHeader = ({ title, count }: { title: string; count: number }) => (
  <View style={styles.groupHeader}>
    <Text style={styles.groupTitle}>{title}</Text>
    <Text style={styles.groupCount}>{count}</Text>
  </View>
);

// Main component
export function StudentProgressGrid({
  students,
  view = 'grid',
  onStudentPress,
  onQuickAction,
  showFilters = true,
  showSearch = true,
  loading = false,
  refreshing = false,
  onRefresh,
  groupBy = 'none'
}: StudentProgressGridProps) {
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>(view);
  const [filterBy, setFilterBy] = useState<'all' | 'present' | 'needs-attention' | 'milestones'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'kmap'>('name');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
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
  }, [fadeAnim, scaleAnim]);

  // Memoized filtered and sorted students with grouping
  const processedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      // Search filter - handle both naming conventions
      if (searchQuery) {
        const firstName = student.firstName || student.first_name || '';
        const lastName = student.lastName || student.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        if (!fullName.includes(searchQuery.toLowerCase())) return false;
      }

      // Status filter
      switch (filterBy) {
        case 'present':
          return student.attendance.present;
        case 'needs-attention':
          return student.needsAttention;
        case 'milestones':
          return !!student.recentMilestone;
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.dailyProgress.percentage - a.dailyProgress.percentage;
        case 'kmap': {
          const aTotal = Object.values(a.kmapScores).reduce((sum, val) => sum + val, 0);
          const bTotal = Object.values(b.kmapScores).reduce((sum, val) => sum + val, 0);
          return bTotal - aTotal;
        }
        default:
          const aName = a.firstName || a.first_name || '';
          const bName = b.firstName || b.first_name || '';
          return aName.localeCompare(bName);
      }
    });

    // Group if needed
    if (groupBy !== 'none') {
      const grouped: Record<string, StudentProgress[]> = {};
      
      filtered.forEach(student => {
        let groupKey = '';
        switch (groupBy) {
          case 'attendance':
            groupKey = student.attendance.status;
            break;
          case 'progress':
            const pct = student.dailyProgress.percentage;
            groupKey = pct >= 80 ? 'High Progress (80%+)' : 
                      pct >= 50 ? 'Medium Progress (50-79%)' : 
                      'Low Progress (<50%)';
            break;
          case 'attention':
            groupKey = student.needsAttention ? 'Needs Attention' : 'On Track';
            break;
        }
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(student);
      });
      
      // Return as flat array with group markers
      return Object.entries(grouped).flatMap(([group, items]) => [
        { isGroupHeader: true, title: group, count: items.length },
        ...items
      ]);
    }

    return filtered;
  }, [students, filterBy, searchQuery, sortBy, groupBy]);

  const renderStudentCard = ({ item }: { item: any }) => {
    // Handle group headers
    if (item.isGroupHeader) {
      return <GroupHeader title={item.title} count={item.count} />;
    }

    return (
      <StudentCard 
        student={item}
        onPress={() => onStudentPress?.(item)}
        onQuickAction={onQuickAction ? (action) => onQuickAction(item, action) : undefined}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
      />
    );
  };

  const renderStudentListItem = ({ item }: { item: any }) => {
    // Handle group headers in list view
    if (item.isGroupHeader) {
      return <GroupHeader title={item.title} count={item.count} />;
    }

    const student = item as StudentProgress;
    const kmapTotal = Object.values(student.kmapScores).reduce((sum, val) => sum + val, 0);
    
    return (
      <Animated.View
        style={[
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.listItem,
            !student.attendance.present && styles.absentListItem,
            student.needsAttention && styles.attentionListItem
          ]}
          onPress={() => onStudentPress?.(student)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`${student.firstName} ${student.lastName}`}
        >
          <View style={styles.listLeft}>
            {/* Avatar with Status */}
            <View style={styles.listAvatarContainer}>
              {student.photoUrl ? (
                <Image source={{ uri: student.photoUrl }} style={styles.listAvatar} />
              ) : (
                <View style={styles.listAvatarPlaceholder}>
                  <User size={20} color={colors.gray500} />
                </View>
              )}
              {student.engagementLevel && (
                <View style={[
                  styles.listEngagementDot, 
                  { backgroundColor: getEngagementColor(student.engagementLevel) }
                ]} />
              )}
            </View>

            {/* Info */}
            <View style={styles.listInfo}>
              <View style={styles.listNameRow}>
                <Text style={styles.listName}>
                  {student.firstName} {student.lastName}
                </Text>
                <View style={styles.listBadges}>
                  {student.needsAttention && (
                    <AlertCircle size={16} color={colors.warning} />
                  )}
                  {student.recentMilestone && (
                    <Award size={16} color={colors.primary} />
                  )}
                </View>
              </View>
              
              <View style={styles.listMetaRow}>
                <Text style={[
                  styles.listAttendance,
                  !student.attendance.present && styles.listAttendanceAbsent
                ]}>
                  {student.attendance.status}
                  {student.attendance.arrivalTime && ` (${student.attendance.arrivalTime})`}
                </Text>
                <Text style={styles.listDot}>•</Text>
                <Text style={styles.listProgress}>
                  {student.dailyProgress.completed}/{student.dailyProgress.total}
                </Text>
                <Text style={styles.listDot}>•</Text>
                <View style={styles.listKmapSummary}>
                  <BarChart3 size={14} color={colors.gray600} />
                  <Text style={styles.listKmapText}>{Math.round(kmapTotal)}/30</Text>
                </View>
              </View>

              {/* Last Activity in list view */}
              {student.lastActivity && (
                <Text style={styles.listLastActivity} numberOfLines={1}>
                  Last: {student.lastActivity.name}
                </Text>
              )}

              {/* Mini Progress Bar */}
              <View style={styles.listProgressBar}>
                <ProgressBar
                  progress={student.dailyProgress.percentage / 100}
                  height={3}
                  color={student.attendance.present ? colors.primary : colors.gray400}
                />
              </View>
            </View>
          </View>

          {/* Right Side */}
          <View style={styles.listRight}>
            <Text style={styles.listPercentage}>
              {Math.round(student.dailyProgress.percentage)}%
            </Text>
            {getTrendIcon(student.trend)}
            {onQuickAction && (
              <TouchableOpacity
                onPress={() => onQuickAction(student, 'menu')}
                style={styles.listQuickAction}
              >
                <MoreVertical size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
            <ChevronRight size={20} color={colors.gray400} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={48} color={colors.gray400} />
      <Text style={styles.emptyText}>No students found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try adjusting your search' : 'No students match the current filters'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.gray500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessible={true}
            accessibilityLabel="Search students"
          />
        </View>
      )}

      {/* Filters and Controls */}
      {showFilters && (
        <View style={styles.header}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, filterBy === 'all' && styles.filterChipActive]}
              onPress={() => setFilterBy('all')}
            >
              <Text style={[styles.filterText, filterBy === 'all' && styles.filterTextActive]}>
                All ({students.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterBy === 'present' && styles.filterChipActive]}
              onPress={() => setFilterBy('present')}
            >
              <CheckCircle2 size={14} color={filterBy === 'present' ? colors.primary : colors.gray600} />
              <Text style={[styles.filterText, filterBy === 'present' && styles.filterTextActive]}>
                Present ({students.filter(s => s.attendance.present).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterBy === 'needs-attention' && styles.filterChipActive]}
              onPress={() => setFilterBy('needs-attention')}
            >
              <AlertCircle size={14} color={filterBy === 'needs-attention' ? colors.primary : colors.gray600} />
              <Text style={[styles.filterText, filterBy === 'needs-attention' && styles.filterTextActive]}>
                Attention ({students.filter(s => s.needsAttention).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterBy === 'milestones' && styles.filterChipActive]}
              onPress={() => setFilterBy('milestones')}
            >
              <Award size={14} color={filterBy === 'milestones' ? colors.primary : colors.gray600} />
              <Text style={[styles.filterText, filterBy === 'milestones' && styles.filterTextActive]}>
                Milestones ({students.filter(s => s.recentMilestone).length})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.rightControls}>
            {/* Sort Options */}
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                const options: ('name' | 'progress' | 'kmap')[] = ['name', 'progress', 'kmap'];
                const currentIndex = options.indexOf(sortBy);
                setSortBy(options[(currentIndex + 1) % options.length]);
              }}
              accessible={true}
              accessibilityLabel={`Sort by ${sortBy}`}
            >
              <Filter size={16} color={colors.gray600} />
            </TouchableOpacity>

            {/* View Toggle */}
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, selectedView === 'grid' && styles.viewButtonActive]}
                onPress={() => setSelectedView('grid')}
                accessible={true}
                accessibilityLabel="Grid view"
                accessibilityState={{ selected: selectedView === 'grid' }}
              >
                <Grid3x3 size={20} color={selectedView === 'grid' ? colors.primary : colors.gray500} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, selectedView === 'list' && styles.viewButtonActive]}
                onPress={() => setSelectedView('list')}
                accessible={true}
                accessibilityLabel="List view"
                accessibilityState={{ selected: selectedView === 'list' }}
              >
                <List size={20} color={selectedView === 'list' ? colors.primary : colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Content */}
      {selectedView === 'grid' ? (
        <FlatList
          data={processedStudents}
          renderItem={renderStudentCard}
          keyExtractor={(item, index) => item.isGroupHeader ? `group-${index}` : item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={processedStudents}
          renderItem={renderStudentListItem}
          keyExtractor={(item, index) => item.isGroupHeader ? `group-${index}` : item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

// Complete styles with all features
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md + spacing.sm,
    top: spacing.sm + 10,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.xl + spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center',
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '20',
  },
  filterText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
  sortButton: {
    padding: spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
  },
  viewButton: {
    padding: spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    ...shadows.xs,
  },
  
  // Group header styles
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  groupCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  
  // Grid styles
  gridContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: cardWidth,
    alignItems: 'center',
    ...shadows.sm,
    position: 'relative',
  },
  absentCard: {
    opacity: 0.7,
    backgroundColor: colors.gray50,
  },
  attentionCard: {
    borderWidth: 2,
    borderColor: colors.warning + '30',
  },
  quickActionButton: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    padding: spacing.xs,
    zIndex: 1,
  },
  statusIndicators: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  attentionBadge: {
    backgroundColor: colors.warning + '20',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  milestoneBadge: {
    backgroundColor: colors.primary + '20',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  activityBadge: {
    backgroundColor: colors.gray200,
    padding: 4,
    borderRadius: borderRadius.full,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.lg,
    fontWeight: '600',
  },
  attendanceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  attendanceText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: '600',
  },
  engagementIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  studentName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressSection: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  weeklyTrend: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  weeklyTrendText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  kmapSection: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  kmapBars: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  kmapItem: {
    alignItems: 'center',
    position: 'relative',
  },
  kmapBarContainer: {
    width: 20,
    height: 30,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  kmapBar: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  kmapChange: {
    position: 'absolute',
    top: -10,
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  notesCount: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  miniActionButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  lastActivityContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  lastActivityText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  activityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: typography.xs,
    color: colors.warning,
    fontWeight: '500',
  },
  attentionReason: {
    fontSize: typography.xs,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  
  // List styles
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  listItem: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  absentListItem: {
    opacity: 0.7,
    backgroundColor: colors.gray50,
  },
  attentionListItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listAvatarContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  listAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEngagementDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  listInfo: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listName: {
    fontSize: typography.base,
    fontWeight: '500',
    color: colors.text,
  },
  listBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  listAttendance: {
    fontSize: typography.sm,
    color: colors.success,
    textTransform: 'capitalize',
  },
  listAttendanceAbsent: {
    color: colors.error,
  },
  listDot: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  listProgress: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  listKmapSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listKmapText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  listLastActivity: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  listProgressBar: {
    marginTop: spacing.xs,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listPercentage: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
  },
  listQuickAction: {
    padding: spacing.xs,
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyText: {
    fontSize: typography.lg,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});