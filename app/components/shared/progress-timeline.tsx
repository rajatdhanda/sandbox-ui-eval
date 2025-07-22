// app/components/shared/progress-timeline.tsx
// Path: app/components/shared/progress-timeline.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  StyleSheet
} from 'react-native';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Share,
  Eye,
  BarChart3,
  Zap,
  Brain,
  Heart,
  FileText,
  Camera,
  Star,
  AlertCircle,
  CheckCircle2,
  X,
  Info
} from 'lucide-react-native';
import Svg, {
  Line,
  Path,
  Circle as SvgCircle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Rect
} from 'react-native-svg';

// ✅ BIBLE: Import types first
import type {
  Child,
  ProgressRecord,
  KMapScores,
  KMapAnalysis,
  MilestoneProgress,
  ChildMilestone,
  ObservationData,
  ActivitySchedule
} from '@/app/components/shared/type/data-service.types';

// ✅ BIBLE: Import shared components
import { KMapRadarChart } from './kmap-radar-chart';
import { ProgressBar, DimensionPills } from './progress-components';
import { QuickObservationPanel } from './quick-observation-panel';
import { EmptyState, LoadingState } from './empty-state';

// ✅ BIBLE: Import hooks
import { useLearningTracking } from '@/hooks/use-learning-tracking';
import { useMilestoneTracking } from '@/hooks/use-milestone-tracking';
import { useKMapAnalytics } from '@/hooks/use-kmap-analytics';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { useAttachments } from '@/hooks/use-attachments';

// ✅ BIBLE: Import styles
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - spacing.lg * 2;
const chartHeight = 200;

const DIMENSION_CONFIG = {
  move: { color: colors.error, label: 'Physical', icon: Zap },
  think: { color: colors.warning, label: 'Cognitive', icon: Brain },
  endure: { color: colors.success, label: 'Social-Emotional', icon: Heart }
};

const PERIOD_OPTIONS = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'quarter', label: 'Quarter', days: 90 },
  { key: 'year', label: 'Year', days: 365 }
];

const TREND_THRESHOLD = 0.1;

// ✅ BIBLE: Simple props that work with actual usage
interface ProgressTimelineProps {
  childId: string;
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  showMilestones?: boolean;
  onMilestonePress?: (milestone: ChildMilestone) => void;
  onAddObservation?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  allowInteraction?: boolean;
}

export function ProgressTimeline({
  childId,
  dateRange = 'month',
  showMilestones = true,
  onMilestonePress,
  onAddObservation,
  onExport,
  onShare,
  allowInteraction = true
}: ProgressTimelineProps) {
  // ✅ BIBLE: State management
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>(dateRange);
  const [selectedDimension, setSelectedDimension] = useState<'all' | 'move' | 'think' | 'endure'>('all');
  const [showMilestoneDetails, setShowMilestoneDetails] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ChildMilestone | null>(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [showObservationPanel, setShowObservationPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // ✅ BIBLE: Use hooks for data fetching
  const { getObservationsByContext, loading: observationsLoading } = useLearningTracking();
  const { getMilestoneProgress, loading: milestonesLoading } = useMilestoneTracking();
  const { calculateChildKMap, loading: kmapLoading } = useKMapAnalytics();
  const { generateProgressSummary } = useProgressTracking();
  const { getMediaTimeline } = useAttachments();
  
  // ✅ BIBLE: Data state
  const [progressData, setProgressData] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<MilestoneProgress | null>(null);
  const [kmapAnalysis, setKmapAnalysis] = useState<KMapAnalysis | null>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  
  // ✅ BIBLE: Load data with hooks
  useEffect(() => {
    loadAllData();
  }, [childId, selectedPeriod]);
  
  const loadAllData = async () => {
    try {
    // Add date calculations
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
      // Get observations
      const obs = await getObservationsByContext({
  level: 'child',
  id: childId,
  dateRange: {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  }
});
      if (obs && obs.success && obs.data) {
  setObservations(obs.data);
} else {
  setObservations([]);
}
      
      // Get progress summary
      const summary = await generateProgressSummary(
  childId,
  selectedPeriod,
  startDate.toISOString().split('T')[0],
  endDate.toISOString().split('T')[0]
);
      
      // Transform observations into progress points for chart
      const progressPoints = transformToProgressPoints(obs || [], summary);
      setProgressData(progressPoints);
      
      // Get milestones
      if (showMilestones) {
        const milestoneData = await getMilestoneProgress(childId);
        setMilestones(milestoneData);
      }
      
      // Get K-Map analysis
      const kmap = await calculateChildKMap(childId);
      setKmapAnalysis(kmap);
      
      // Get media
      const media = await getMediaTimeline(childId);
      setMediaItems(media || []);
      
      // Set current date to latest
      if (progressPoints.length > 0) {
        setCurrentDateIndex(progressPoints.length - 1);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  // ✅ Transform data for charts
  const transformToProgressPoints = (observations: any[], summary: any) => {
    // Group observations by date
    const grouped = observations.reduce((acc, obs) => {
      const date = new Date(obs.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(obs);
      return acc;
    }, {});
    
    // Create progress points with K-Map scores
    return Object.entries(grouped).map(([date, dayObs]: [string, any]) => {
      // Calculate average scores for the day
      const scores = calculateDayScores(dayObs);
      
      return {
        date,
        activitiesCompleted: dayObs.length,
        totalActivities: dayObs.length, // Would need actual total from schedule
        averageScore: scores.average,
        kmapScores: scores.kmap,
        notes: dayObs.filter((o: any) => o.teacher_notes).length,
        mediaCount: dayObs.filter((o: any) => o.attachments?.length > 0).length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // ✅ Calculate scores from observations
  const calculateDayScores = (observations: any[]) => {
    const kmap = { move: 0, think: 0, endure: 0 };
    let totalScore = 0;
    
    observations.forEach(obs => {
      // Map observation types to K-Map dimensions
      if (obs.observation_type === 'physical') kmap.move += 1;
      if (obs.observation_type === 'academic') kmap.think += 1;
      if (obs.observation_type === 'social') kmap.endure += 1;
      
      totalScore += obs.quality_score || 3;
    });
    
    const count = observations.length || 1;
    
    return {
      average: totalScore / count,
      kmap: {
        move: Math.min(10, (kmap.move / count) * 10),
        think: Math.min(10, (kmap.think / count) * 10),
        endure: Math.min(10, (kmap.endure / count) * 10)
      }
    };
  };
  
  // ✅ Calculate trends
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const change = (current - previous) / previous;
    if (change > TREND_THRESHOLD) return 'up';
    if (change < -TREND_THRESHOLD) return 'down';
    return 'stable';
  };

  // ✅ Enhanced chart data with trend analysis
  const getChartData = useMemo(() => {
    const grouped = progressData.reduce((acc, point) => {
      const date = new Date(point.date);
      let key: string;
      
      switch (selectedPeriod) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          points: [],
          avgScore: 0,
          avgKmap: { move: 0, think: 0, endure: 0 },
          trend: 'stable' as const
        };
      }
      
      acc[key].points.push(point);
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate averages and trends
    const chartData = Object.values(grouped).map((group: any, index: number, array: any[]) => {
      const avgScore = group.points.reduce((sum: number, p: any) => 
        sum + p.averageScore, 0) / group.points.length;
      
      const avgKmap = {
        move: group.points.reduce((sum: number, p: any) => 
          sum + p.kmapScores.move, 0) / group.points.length,
        think: group.points.reduce((sum: number, p: any) => 
          sum + p.kmapScores.think, 0) / group.points.length,
        endure: group.points.reduce((sum: number, p: any) => 
          sum + p.kmapScores.endure, 0) / group.points.length,
      };
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (index > 0) {
        const prevAvgScore = array[index - 1].avgScore;
        trend = calculateTrend(avgScore, prevAvgScore);
      }
      
      return {
        date: group.date,
        avgScore: Math.round(avgScore * 10) / 10,
        avgKmap,
        pointCount: group.points.length,
        trend,
        completionRate: 100 // Would calculate from actual data
      };
    });
    
    return chartData;
  }, [progressData, selectedPeriod]);

  const maxScore = 5;
  const maxKmapScore = 10;

  // Calculate scale for chart
  const xScale = chartWidth / (Math.max(getChartData.length - 1, 1));
  const yScale = chartHeight / (selectedDimension === 'all' ? maxScore : maxKmapScore);

  // ✅ Path generation with smoothing
  const generatePath = (data: any[], key: string, max: number) => {
    if (data.length === 0) return '';
    
    const points = data.map((d, i) => {
      const value = key === 'avgScore' ? d[key] : d.avgKmap[key];
      return {
        x: i * xScale,
        y: chartHeight - (value * (chartHeight / max))
      };
    });
    
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const xMid = (points[i - 1].x + points[i].x) / 2;
      const yMid = (points[i - 1].y + points[i].y) / 2;
      const cp1x = (xMid + points[i - 1].x) / 2;
      const cp2x = (xMid + points[i].x) / 2;
      
      path += ` Q ${cp1x} ${points[i - 1].y} ${xMid} ${yMid}`;
      path += ` Q ${cp2x} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  };

  // ✅ Area path for gradient
  const generateAreaPath = (data: any[], key: string, max: number) => {
    const linePath = generatePath(data, key, max);
    if (!linePath) return '';
    
    const lastPoint = data[data.length - 1];
    const value = key === 'avgScore' ? lastPoint[key] : lastPoint.avgKmap[key];
    const lastY = chartHeight - (value * (chartHeight / max));
    
    return `${linePath} L ${(data.length - 1) * xScale} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  const handleMilestonePress = (milestone: ChildMilestone) => {
    setSelectedMilestone(milestone);
    setShowMilestoneDetails(true);
    onMilestonePress?.(milestone);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  const handleAddObservation = () => {
    if (allowInteraction) {
      setShowObservationPanel(true);
      onAddObservation?.();
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      Alert.alert(
        'Export Progress Report',
        'Choose export format:',
        [
          { text: 'PDF Report', onPress: () => console.log('Export as PDF') },
          { text: 'CSV Data', onPress: () => console.log('Export as CSV') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      Alert.alert(
        'Share Progress',
        'Share progress report with:',
        [
          { text: 'Parents', onPress: () => console.log('Share with parents') },
          { text: 'Team', onPress: () => console.log('Share with team') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // ✅ Render chart with all features
  const renderChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Progress Over Time</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => Alert.alert('Chart Info', 'This chart shows average scores and progress over time. Tap on data points for details.')}
        >
          <Info size={16} color={colors.gray500} />
        </TouchableOpacity>
      </View>
      
      {/* Period Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
      >
        {PERIOD_OPTIONS.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodChip,
              selectedPeriod === period.key && styles.periodChipActive
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text style={[
              styles.periodText,
              selectedPeriod === period.key && styles.periodTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dimension Filter */}
      <View style={styles.dimensionFilter}>
        <TouchableOpacity
          style={[styles.dimChip, selectedDimension === 'all' && styles.dimChipActive]}
          onPress={() => setSelectedDimension('all')}
        >
          <BarChart3 size={16} color={selectedDimension === 'all' ? colors.white : colors.gray600} />
          <Text style={[styles.dimText, selectedDimension === 'all' && styles.dimTextActive]}>
            Overall
          </Text>
        </TouchableOpacity>
        {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dimChip,
                selectedDimension === key && styles.dimChipActive,
                selectedDimension === key && { backgroundColor: config.color }
              ]}
              onPress={() => setSelectedDimension(key as any)}
            >
              <Icon size={16} color={selectedDimension === key ? colors.white : config.color} />
              <Text style={[
                styles.dimText,
                selectedDimension === key && styles.dimTextActive
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Line Chart */}
      <View style={styles.chart}>
        {getChartData.length > 0 ? (
          <Svg width={chartWidth} height={chartHeight + 40}>
            <Defs>
              <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <Stop 
                  offset="0%" 
                  stopColor={selectedDimension === 'all' ? colors.primary : DIMENSION_CONFIG[selectedDimension]?.color || colors.primary} 
                  stopOpacity="0.3" 
                />
                <Stop 
                  offset="100%" 
                  stopColor={selectedDimension === 'all' ? colors.primary : DIMENSION_CONFIG[selectedDimension]?.color || colors.primary} 
                  stopOpacity="0.05" 
                />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <G key={i}>
                <Line
                  x1={0}
                  y1={chartHeight - (i * chartHeight / 5)}
                  x2={chartWidth}
                  y2={chartHeight - (i * chartHeight / 5)}
                  stroke={colors.gray200}
                  strokeWidth={1}
                  strokeDasharray="5,5"
                />
                <SvgText
                  x={-10}
                  y={chartHeight - (i * chartHeight / 5) + 5}
                  fontSize={10}
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {selectedDimension === 'all' ? i : i * 2}
                </SvgText>
              </G>
            ))}

            {/* Data visualization */}
            {selectedDimension === 'all' ? (
              <G>
                <Path
                  d={generateAreaPath(getChartData, 'avgScore', maxScore)}
                  fill="url(#gradient)"
                />
                <Path
                  d={generatePath(getChartData, 'avgScore', maxScore)}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={3}
                />
                {getChartData.map((point, i) => (
                  <G key={i}>
                    <SvgCircle
                      cx={i * xScale}
                      cy={chartHeight - (point.avgScore * yScale)}
                      r={6}
                      fill={colors.primary}
                      stroke={colors.white}
                      strokeWidth={2}
                      onPress={() => setShowTooltip(i)}
                    />
                    {point.trend !== 'stable' && (
                      <SvgText
                        x={i * xScale}
                        y={chartHeight - (point.avgScore * yScale) - 15}
                        fontSize={12}
                        fill={point.trend === 'up' ? colors.success : colors.error}
                        textAnchor="middle"
                      >
                        {point.trend === 'up' ? '↑' : '↓'}
                      </SvgText>
                    )}
                    <SvgText
                      x={i * xScale}
                      y={chartHeight + 20}
                      fontSize={10}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                    >
                      {point.date.split('-').pop()}
                    </SvgText>
                  </G>
                ))}
              </G>
            ) : (
              <G>
                <Path
                  d={generateAreaPath(getChartData, selectedDimension, maxKmapScore)}
                  fill="url(#gradient)"
                />
                <Path
                  d={generatePath(getChartData, selectedDimension, maxKmapScore)}
                  fill="none"
                  stroke={DIMENSION_CONFIG[selectedDimension].color}
                  strokeWidth={3}
                />
                {getChartData.map((point, i) => (
                  <G key={i}>
                    <SvgCircle
                      cx={i * xScale}
                      cy={chartHeight - (point.avgKmap[selectedDimension] * (chartHeight / maxKmapScore))}
                      r={6}
                      fill={DIMENSION_CONFIG[selectedDimension].color}
                      stroke={colors.white}
                      strokeWidth={2}
                      onPress={() => setShowTooltip(i)}
                    />
                    <SvgText
                      x={i * xScale}
                      y={chartHeight + 20}
                      fontSize={10}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                    >
                      {point.date.split('-').pop()}
                    </SvgText>
                  </G>
                ))}
              </G>
            )}
          </Svg>
        ) : (
          <EmptyState 
            title="No data for this period"
            subtitle="Try selecting a different time range"
          />
        )}

        {/* Tooltip */}
        {showTooltip !== null && getChartData[showTooltip] && (
          <TouchableOpacity
            style={[
              styles.tooltip,
              { 
                left: showTooltip * xScale - 50,
                top: selectedDimension === 'all' 
                  ? chartHeight - (getChartData[showTooltip].avgScore * yScale) - 60
                  : chartHeight - (getChartData[showTooltip].avgKmap[selectedDimension] * (chartHeight / maxKmapScore)) - 60
              }
            ]}
            onPress={() => setShowTooltip(null)}
          >
            <Text style={styles.tooltipText}>
              {selectedDimension === 'all' 
                ? `Score: ${getChartData[showTooltip].avgScore}/5`
                : `${DIMENSION_CONFIG[selectedDimension].label}: ${getChartData[showTooltip].avgKmap[selectedDimension].toFixed(1)}/10`
              }
            </Text>
            <Text style={styles.tooltipSubtext}>
              {getChartData[showTooltip].pointCount} activities
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Improving</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray400 }]} />
          <Text style={styles.legendText}>Stable</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Needs Attention</Text>
        </View>
      </View>
    </View>
  );

  // ✅ Render milestones with all features
  const renderMilestoneTimeline = () => {
    if (!milestones || !milestones.milestones) return null;
    
    return (
      <View style={styles.milestoneSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Milestones Achieved</Text>
          <Text style={styles.milestoneCount}>{milestones.achieved} of {milestones.total}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.milestoneTimeline}>
            {milestones.milestones
              .filter((m: any) => m.status === 'achieved')
              .map((milestone: any, index: number) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={styles.milestoneItem}
                  onPress={() => handleMilestonePress(milestone)}
                  disabled={!allowInteraction}
                >
                  <View style={styles.milestoneLine}>
                    {index > 0 && <View style={styles.milestoneConnector} />}
                    <View style={[
                      styles.milestoneDot,
                      { backgroundColor: getCategoryColor(milestone.category) }
                    ]}>
                      <Award size={16} color={colors.white} />
                    </View>
                  </View>
                  <View style={styles.milestoneContent}>
                    <Text style={styles.milestoneDate}>
                      {new Date(milestone.achievementDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.milestoneTitle} numberOfLines={2}>
                      {milestone.definition?.title || milestone.title}
                    </Text>
                    <View style={[
                      styles.milestoneCategoryBadge,
                      { backgroundColor: getCategoryColor(milestone.category) + '20' }
                    ]}>
                      <Text style={[
                        styles.milestoneCategoryText,
                        { color: getCategoryColor(milestone.category) }
                      ]}>
                        {milestone.category}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            
            {allowInteraction && (
              <TouchableOpacity 
                style={styles.addMilestoneButton}
                onPress={() => Alert.alert('Add Milestone', 'This would open milestone creation form')}
              >
                <View style={styles.addMilestoneDot}>
                  <Text style={styles.addMilestoneText}>+</Text>
                </View>
                <Text style={styles.addMilestoneLabel}>Add New</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ✅ Render current snapshot with navigation
  const renderCurrentSnapshot = () => {
    const currentPoint = progressData[currentDateIndex];
    if (!currentPoint) return null;

    const previousPoint = currentDateIndex > 0 ? progressData[currentDateIndex - 1] : null;
    const scoreChange = previousPoint 
      ? ((currentPoint.averageScore - previousPoint.averageScore) / previousPoint.averageScore * 100).toFixed(1)
      : null;

    return (
      <View style={styles.snapshotSection}>
        <View style={styles.snapshotHeader}>
          <Text style={styles.sectionTitle}>Daily Snapshot</Text>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              onPress={() => setCurrentDateIndex(Math.max(0, currentDateIndex - 1))}
              disabled={currentDateIndex === 0}
            >
              <ChevronLeft 
                size={20} 
                color={currentDateIndex === 0 ? colors.gray300 : colors.gray600} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.currentDate}>
                {new Date(currentPoint.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentDateIndex(Math.min(progressData.length - 1, currentDateIndex + 1))}
              disabled={currentDateIndex === progressData.length - 1}
            >
              <ChevronRight 
                size={20} 
                color={currentDateIndex === progressData.length - 1 ? colors.gray300 : colors.gray600} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* K-Map Radar */}
        <View style={styles.radarContainer}>
          <KMapRadarChart
            scores={currentPoint.kmapScores}
            compareData={previousPoint?.kmapScores}
            size={200}
            showLabels
            showValues
            showBalance
          />
        </View>

        {/* Daily Stats */}
        <View style={styles.dailyStats}>
          <View style={styles.statItem}>
            <CheckCircle2 size={20} color={colors.success} />
            <Text style={styles.statValue}>
              {currentPoint.activitiesCompleted}/{currentPoint.totalActivities}
            </Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statItem}>
            <Star size={20} color={colors.warning} />
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{currentPoint.averageScore.toFixed(1)}/5</Text>
              {scoreChange && (
                <Text style={[
                  styles.changeIndicator,
                  { color: parseFloat(scoreChange) >= 0 ? colors.success : colors.error }
                ]}>
                  {parseFloat(scoreChange) >= 0 ? '+' : ''}{scoreChange}%
                </Text>
              )}
            </View>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          {currentPoint.mediaCount > 0 && (
            <View style={styles.statItem}>
              <Camera size={20} color={colors.info} />
              <Text style={styles.statValue}>{currentPoint.mediaCount}</Text>
              <Text style={styles.statLabel}>Media</Text>
            </View>
          )}
          {currentPoint.notes > 0 && (
            <View style={styles.statItem}>
              <FileText size={20} color={colors.primary} />
              <Text style={styles.statValue}>{currentPoint.notes}</Text>
              <Text style={styles.statLabel}>Notes</Text>
            </View>
          )}
        </View>

        {allowInteraction && (
          <TouchableOpacity
            style={styles.addObservationButton}
            onPress={() => {
              setSelectedDate(currentPoint.date);
              handleAddObservation();
            }}
          >
            <Text style={styles.addObservationText}>Add Observation for This Day</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ Summary stats
  const renderSummaryStats = () => {
    const stats = {
      totalObservations: observations.length,
      averageEngagement: 4.2, // Would calculate from actual data
      attendanceRate: 95, // Would calculate from actual data
      completionRate: progressData.length > 0 
        ? Math.round((progressData.filter(p => p.activitiesCompleted > 0).length / progressData.length) * 100)
        : 0
    };

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Period Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Calendar size={24} color={colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{stats.attendanceRate}%</Text>
            <Text style={styles.summaryLabel}>Attendance</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={styles.summaryValue}>{stats.completionRate}%</Text>
            <Text style={styles.summaryLabel}>Completion</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Heart size={24} color={colors.warning} />
            </View>
            <Text style={styles.summaryValue}>{stats.averageEngagement.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Engagement</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Award size={24} color={colors.info} />
            </View>
            <Text style={styles.summaryValue}>{milestones?.achieved || 0}</Text>
            <Text style={styles.summaryLabel}>Milestones</Text>
          </View>
        </View>
      </View>
    );
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'physical': colors.error,
      'cognitive': colors.warning,
      'social-emotional': colors.success,
      'language': colors.info,
      'self-care': colors.primary
    };
    return categoryColors[category] || colors.gray500;
  };

  // ✅ Milestone modal
  const renderMilestoneModal = () => (
    <Modal
      visible={showMilestoneDetails}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowMilestoneDetails(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Milestone Details</Text>
          <TouchableOpacity onPress={() => setShowMilestoneDetails(false)}>
            <X size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        {selectedMilestone && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalMilestone}>
              <View style={[
                styles.modalIcon,
                { backgroundColor: getCategoryColor(selectedMilestone.category || '') }
              ]}>
                <Award size={32} color={colors.white} />
              </View>
              <Text style={styles.modalMilestoneTitle}>
                {selectedMilestone.definition?.title || 'Milestone'}
              </Text>
              <Text style={styles.modalMilestoneDate}>
                Achieved on {new Date(selectedMilestone.achievementDate || '').toLocaleDateString()}
              </Text>
              {selectedMilestone.assessedBy && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={16} color={colors.success} />
                  <Text style={styles.verifiedByText}>
                    Verified by {selectedMilestone.assessedBy}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const isLoading = observationsLoading || milestonesLoading || kmapLoading;

  if (isLoading && progressData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.childName}>Progress Timeline</Text>
          <Text style={styles.dateRange}>
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} View
          </Text>
        </View>
        <View style={styles.headerActions}>
          {allowInteraction && (
            <>
              <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
                <Download size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Share size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* All sections */}
      {renderSummaryStats()}
      {renderChart()}
      {renderCurrentSnapshot()}
      {renderMilestoneTimeline()}
      {renderMilestoneModal()}

      {/* Quick Observation Panel */}
      {showObservationPanel && (
        <QuickObservationPanel
          visible={showObservationPanel}
          onClose={() => {
            setShowObservationPanel(false);
            setSelectedDate('');
          }}
          childId={childId}
          onSubmit={(observation) => {
            console.log('Observation submitted:', observation);
            setShowObservationPanel(false);
            loadAllData(); // Refresh data
          }}
          children={[]} // Add this line - empty array since we're tracking single child
        />
      )}
    </ScrollView>
  );
}

// ✅ BIBLE: StyleSheet.create for all styles
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerInfo: {
    flex: 1,
  },
  childName: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.text,
  },
  dateRange: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summarySection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  summaryValue: {
    fontSize: typography['2xl'],
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chartContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
  },
  infoButton: {
    padding: spacing.xs,
  },
  periodSelector: {
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  dimensionFilter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dimChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  dimChipActive: {
    backgroundColor: colors.primary,
  },
  dimText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  dimTextActive: {
    color: colors.white,
  },
  chart: {
    marginLeft: 20,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.gray900,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '500',
  },
  tooltipSubtext: {
    color: colors.gray300,
    fontSize: typography.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  snapshotSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  currentDate: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  radarContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dailyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  changeIndicator: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  addObservationButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addObservationText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  milestoneSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  milestoneCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  milestoneTimeline: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
  },
  milestoneItem: {
    width: 120,
    marginRight: spacing.lg,
  },
  milestoneLine: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  milestoneConnector: {
    position: 'absolute',
    left: -spacing.lg,
    top: 20,
    width: spacing.lg,
    height: 2,
    backgroundColor: colors.gray300,
  },
  milestoneDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  milestoneContent: {
    alignItems: 'center',
  },
  milestoneDate: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  milestoneTitle: {
    fontSize: typography.sm,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  milestoneCategoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  milestoneCategoryText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  addMilestoneButton: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMilestoneDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  addMilestoneText: {
    fontSize: typography.xl,
    color: colors.gray600,
  },
  addMilestoneLabel: {
    fontSize: typography.sm,
    color: colors.gray600,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalMilestone: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalMilestoneTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalMilestoneDate: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  verifiedByText: {
    fontSize: typography.sm,
    color: colors.success,
  },
});