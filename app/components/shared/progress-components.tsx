// app/components/shared/progress-components.tsx
// Path: app/components/shared/progress-components.tsx
// Unified progress visualization components

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  ViewStyle
} from 'react-native';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Activity,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

// ============================================
// ProgressBar Component (Enhanced from progress-bar.tsx)
// ============================================
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  color?: string;
  showText?: boolean;
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
  stripedAnimation?: boolean;
}

export function ProgressBar({
  current,
  total,
  label,
  color = colors.success,
  showText = true,
  showPercentage = false,
  height = 4,
  animated = true,
  stripedAnimation = false,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [percentage, animated]);

  const widthStyle = animated 
    ? { width: animatedWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
      })}
    : { width: `${percentage}%` };

  return (
    <View style={styles.progressContainer}>
      {label && <Text style={styles.progressLabel}>{label}</Text>}
      
      <View style={styles.progressInfo}>
        {showText && (
          <Text style={styles.progressText}>
            {current}/{total} completed
          </Text>
        )}
        {showPercentage && (
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        )}
      </View>
      
      <View style={[styles.progressTrack, { height }]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { backgroundColor: color },
            widthStyle,
            stripedAnimation && styles.stripedFill
          ]} 
        />
      </View>
    </View>
  );
}

// ============================================
// DimensionPills Component (Enhanced from dimension-pills.tsx)
// ============================================
interface DimensionPillsProps {
  dimensions: Record<string, number>;
  showZero?: boolean;
  colors?: Record<string, string>;
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  onPress?: (dimension: string) => void;
}

export function DimensionPills({
  dimensions,
  showZero = false,
  colors: customColors,
  size = 'md',
  showIcons = false,
  onPress,
}: DimensionPillsProps) {
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

  const sizeStyles = {
    sm: { paddingHorizontal: spacing.xs, paddingVertical: 2, fontSize: typography.xs },
    md: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.sm },
    lg: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.base },
  };

  const Wrapper = onPress ? TouchableOpacity : View;
  
  return (
    <View style={styles.pillsContainer}>
      {activeDimensions.map(([dim, weight]) => {
        const pillColor = pillColors[dim] || colors.primary;
        const wrapperProps = onPress ? { onPress: () => onPress(dim) } : {};
        
        return (
          <Wrapper
            key={dim} 
            style={[
              styles.pill,
              sizeStyles[size],
              { backgroundColor: pillColor + '15' }
            ]}
            {...wrapperProps}
          >
            <Text style={[
              styles.pillText, 
              { color: pillColor, fontSize: sizeStyles[size].fontSize }
            ]}>
              {dim}: {weight}
            </Text>
          </Wrapper>
        );
      })}
    </View>
  );
}

// ============================================
// ProgressSummaryCard Component (New comprehensive card)
// ============================================
interface ProgressSummaryCardProps {
  title: string;
  subtitle?: string;
  period?: string;
  stats: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  kMapScores?: Record<string, number>;
  completionRate?: number;
  onPress?: () => void;
  showDetails?: boolean;
}

export function ProgressSummaryCard({
  title,
  subtitle,
  period,
  stats,
  kMapScores,
  completionRate,
  onPress,
  showDetails = true,
}: ProgressSummaryCardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <CardWrapper style={styles.summaryCard} {...cardProps}>
      {/* Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleContainer}>
          <Text style={styles.summaryTitle}>{title}</Text>
          {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
        </View>
        {period && (
          <View style={styles.periodBadge}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.periodText}>{period}</Text>
          </View>
        )}
      </View>

      {/* Completion Progress */}
      {completionRate !== undefined && (
        <View style={styles.summarySection}>
          <ProgressBar
            current={completionRate}
            total={100}
            label="Overall Progress"
            showPercentage
            height={8}
            animated
          />
        </View>
      )}

      {/* K-Map Scores */}
      {kMapScores && Object.keys(kMapScores).length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionLabel}>Development Areas</Text>
          <DimensionPills 
            dimensions={kMapScores} 
            size="md"
            showIcons
          />
        </View>
      )}

      {/* Stats Grid */}
      {showDetails && (
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              {stat.icon && (
                <View style={[styles.statIcon, { backgroundColor: (stat.color || colors.primary) + '15' }]}>
                  {stat.icon}
                </View>
              )}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.trend && (
                <View style={styles.trendIndicator}>
                  <TrendingUp 
                    size={12} 
                    color={stat.trend === 'up' ? colors.success : stat.trend === 'down' ? colors.error : colors.gray400}
                    style={stat.trend === 'down' ? { transform: [{ rotate: '180deg' }] } : {}}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Action Indicator */}
      {onPress && (
        <View style={styles.actionIndicator}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      )}
    </CardWrapper>
  );
}

// ============================================
// ProgressRing Component (New circular progress)
// ============================================
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.gray200,
  showText = true,
  label,
  animated = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const animatedOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedOffset, {
        toValue: strokeDashoffset,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [strokeDashoffset, animated]);

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? animatedOffset : strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showText && (
        <View style={styles.ringTextContainer}>
          <Text style={styles.ringPercentage}>{percentage}%</Text>
          {label && <Text style={styles.ringLabel}>{label}</Text>}
        </View>
      )}
    </View>
  );
}

// Note: For React Native, you'll need to install react-native-svg
// and import Svg, Circle from 'react-native-svg'
// For now, here's a simple fallback:
const Svg = View;
const Circle = View;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================
// MilestoneProgress Component (New)
// ============================================
interface MilestoneProgressProps {
  milestones: {
    id: string;
    title: string;
    status: 'not_started' | 'in_progress' | 'completed';
    date?: string;
  }[];
  compact?: boolean;
}

export function MilestoneProgress({ milestones, compact = false }: MilestoneProgressProps) {
  const completed = milestones.filter(m => m.status === 'completed').length;
  const inProgress = milestones.filter(m => m.status === 'in_progress').length;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={colors.success} />;
      case 'in_progress':
        return <Activity size={16} color={colors.warning} />;
      default:
        return <AlertCircle size={16} color={colors.gray400} />;
    }
  };

  if (compact) {
    return (
      <View style={styles.milestoneCompact}>
        <Award size={16} color={colors.primary} />
        <Text style={styles.milestoneCompactText}>
          {completed}/{milestones.length} milestones
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.milestoneContainer}>
      <View style={styles.milestoneHeader}>
        <Award size={20} color={colors.primary} />
        <Text style={styles.milestoneTitle}>Milestones</Text>
        <Text style={styles.milestoneSummary}>
          {completed} completed, {inProgress} in progress
        </Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.milestoneList}>
          {milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              {getStatusIcon(milestone.status)}
              <Text 
                style={[
                  styles.milestoneText,
                  milestone.status === 'completed' && styles.milestoneCompleted
                ]}
                numberOfLines={2}
              >
                {milestone.title}
              </Text>
              {milestone.date && (
                <Text style={styles.milestoneDate}>{milestone.date}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================
// ComparisonBar Component (New)
// ============================================
interface ComparisonBarProps {
  items: {
    label: string;
    value: number;
    color?: string;
  }[];
  maxValue?: number;
  showValues?: boolean;
  height?: number;
}

export function ComparisonBar({ 
  items, 
  maxValue, 
  showValues = true,
  height = 30 
}: ComparisonBarProps) {
  const max = maxValue || Math.max(...items.map(i => i.value));
  
  return (
    <View style={styles.comparisonContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.comparisonItem}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonLabel}>{item.label}</Text>
            {showValues && (
              <Text style={styles.comparisonValue}>{item.value}</Text>
            )}
          </View>
          <View style={[styles.comparisonTrack, { height }]}>
            <View 
              style={[
                styles.comparisonFill,
                { 
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || colors.primary
                }
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = {
  // ProgressBar styles
  progressContainer: {
    marginVertical: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  progressTrack: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  stripedFill: {
    // Add striped pattern with gradients or image in production
  },

  // DimensionPills styles
  pillsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
  },
  pill: {
    borderRadius: borderRadius.full,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  pillText: {
    fontWeight: typography.medium as any,
    textTransform: 'capitalize' as any,
  },

  // ProgressSummaryCard styles
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  periodBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  periodText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  summarySection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  trendIndicator: {
    position: 'absolute' as const,
    top: 0,
    right: -8,
  },
  actionIndicator: {
    position: 'absolute' as const,
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },

  // ProgressRing styles
  ringContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  svg: {
    position: 'absolute' as const,
  },
  ringTextContainer: {
    alignItems: 'center' as const,
  },
  ringPercentage: {
    fontSize: typography.lg,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  ringLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },

  // MilestoneProgress styles
  milestoneContainer: {
    marginVertical: spacing.md,
  },
  milestoneHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  milestoneTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    flex: 1,
  },
  milestoneSummary: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  milestoneList: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  milestoneItem: {
    width: 120,
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  milestoneText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  milestoneCompleted: {
    textDecorationLine: 'line-through' as const,
    color: colors.textSecondary,
  },
  milestoneDate: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  milestoneCompact: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  milestoneCompactText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },

  // ComparisonBar styles
  comparisonContainer: {
    gap: spacing.sm,
  },
  comparisonItem: {
    marginBottom: spacing.sm,
  },
  comparisonHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  comparisonLabel: {
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  comparisonValue: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  comparisonTrack: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    overflow: 'hidden' as const,
  },
  comparisonFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
};