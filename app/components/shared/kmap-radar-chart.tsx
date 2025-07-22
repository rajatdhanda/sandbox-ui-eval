// app/components/shared/kmap-radar-chart.tsx
// Path: app/components/shared/kmap-radar-chart.tsx
// Enhanced K-Map radar chart visualization component

import React, { useMemo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Svg, { 
  Circle, Line, Path, Text as SvgText, G, Polygon 
} from 'react-native-svg';
import { colors, spacing, typography } from '@/lib/styles';

interface KMapRadarChartProps {
  data: {
    move: number;
    think: number;
    endure: number;
  };
  compareData?: {
    move: number;
    think: number;
    endure: number;
  };
  maxValue?: number;
  size?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  showBalance?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
  colors?: {
    move?: string;
    think?: string;
    endure?: string;
    grid?: string;
    background?: string;
    compare?: string;
  };
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'minimal';
}

export function KMapRadarChart({
  data,
  compareData,
  maxValue = 10,
  size = 200,
  showLabels = true,
  showGrid = true,
  showValues = true,
  showBalance = true,
  fillOpacity = 0.3,
  strokeWidth = 2,
  colors: customColors,
  style,
  variant = 'default'
}: KMapRadarChartProps) {
  const chartColors = {
    move: customColors?.move || colors.error,
    think: customColors?.think || colors.warning,
    endure: customColors?.endure || colors.success,
    grid: customColors?.grid || colors.gray300,
    background: customColors?.background || colors.white,
    compare: customColors?.compare || colors.gray500
  };

  const dimensions = ['move', 'think', 'endure'] as const;
  const center = size / 2;
  const radius = variant === 'minimal' ? (size - 20) / 2 : (size - 60) / 2;
  
  // Calculate points for the triangle
  const angleStep = (2 * Math.PI) / 3;
  const startAngle = -Math.PI / 2; // Start from top
  
  const getPoint = (value: number, index: number) => {
    const angle = startAngle + (index * angleStep);
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Calculate vertices for grid and data
  const gridLevels = useMemo(() => {
    const levels = [];
    const steps = variant === 'minimal' ? 3 : 5;
    for (let i = 1; i <= steps; i++) {
      const level = (i / steps) * maxValue;
      const points = dimensions.map((_, index) => {
        const point = getPoint(level, index);
        return `${point.x},${point.y}`;
      }).join(' ');
      levels.push({ points, value: level });
    }
    return levels;
  }, [maxValue, radius, variant]);

  const dataPoints = useMemo(() => {
    const points = dimensions.map((dim, index) => {
      const value = data[dim] || 0;
      return getPoint(value, index);
    });
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }, [data, maxValue, radius]);

  const compareDataPoints = useMemo(() => {
    if (!compareData) return null;
    const points = dimensions.map((dim, index) => {
      const value = compareData[dim] || 0;
      return getPoint(value, index);
    });
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }, [compareData, maxValue, radius]);

  // Calculate label positions
  const labelPositions = useMemo(() => {
    return dimensions.map((dim, index) => {
      const angle = startAngle + (index * angleStep);
      const labelRadius = radius + (variant === 'minimal' ? 15 : 25);
      return {
        dimension: dim,
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle),
        value: data[dim] || 0,
        compareValue: compareData?.[dim] || 0
      };
    });
  }, [data, compareData, radius, variant]);

  // Calculate balance score
  const calculateBalance = (scores: typeof data): number => {
    const values = [scores.move, scores.think, scores.endure];
    const avg = values.reduce((a, b) => a + b, 0) / 3;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 3;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means better balance
    const maxStdDev = 5; // Assuming max score of 10
    const balanceScore = Math.max(0, 100 - (stdDev / maxStdDev) * 100);
    
    return balanceScore;
  };

  const renderMinimal = () => (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Simplified grid */}
      {showGrid && (
        <G>
          {gridLevels.map((level, index) => (
            <Polygon
              key={`grid-${index}`}
              points={level.points}
              fill="none"
              stroke={chartColors.grid}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          ))}
        </G>
      )}

      {/* Data polygon */}
      <Polygon
        points={dataPoints}
        fill={chartColors.think}
        fillOpacity={fillOpacity}
        stroke={chartColors.think}
        strokeWidth={strokeWidth}
      />

      {/* Simple labels */}
      {dimensions.map((dim, index) => {
        const pos = labelPositions[index];
        return (
          <SvgText
            key={dim}
            x={pos.x}
            y={pos.y}
            fontSize={10}
            fill={chartColors[dim]}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {dim[0].toUpperCase()}
          </SvgText>
        );
      })}
    </Svg>
  );

  const renderDefault = () => (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius + 30}
          fill={chartColors.background}
          fillOpacity={0.1}
        />

        {/* Grid */}
        {showGrid && (
          <G>
            {/* Radial grid lines */}
            {gridLevels.map((level, index) => (
              <Polygon
                key={`grid-${index}`}
                points={level.points}
                fill="none"
                stroke={chartColors.grid}
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            ))}
            
            {/* Axis lines */}
            {dimensions.map((_, index) => {
              const endPoint = getPoint(maxValue, index);
              return (
                <Line
                  key={`axis-${index}`}
                  x1={center}
                  y1={center}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke={chartColors.grid}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
              );
            })}
          </G>
        )}

        {/* Compare data polygon (if provided) */}
        {compareData && compareDataPoints && (
          <Polygon
            points={compareDataPoints}
            fill="none"
            stroke={chartColors.compare}
            strokeWidth={strokeWidth}
            strokeDasharray="5,5"
            strokeOpacity={0.7}
          />
        )}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={chartColors.think}
          fillOpacity={fillOpacity}
          stroke={chartColors.think}
          strokeWidth={strokeWidth}
        />

        {/* Data points */}
        {dimensions.map((dim, index) => {
          const value = data[dim] || 0;
          const point = getPoint(value, index);
          return (
            <Circle
              key={`point-${dim}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={chartColors[dim]}
              stroke={chartColors.background}
              strokeWidth={2}
            />
          );
        })}

        {/* Compare data points (if provided) */}
        {compareData && dimensions.map((dim, index) => {
          const value = compareData[dim] || 0;
          const point = getPoint(value, index);
          return (
            <Circle
              key={`compare-point-${dim}`}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={chartColors.compare}
              stroke={chartColors.background}
              strokeWidth={1}
            />
          );
        })}

        {/* Labels */}
        {showLabels && labelPositions.map((label) => (
          <G key={`label-${label.dimension}`}>
            <SvgText
              x={label.x}
              y={label.y}
              fontSize={14}
              fontWeight="600"
              fill={chartColors[label.dimension]}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {label.dimension.toUpperCase()}
            </SvgText>
            {showValues && (
              <SvgText
                x={label.x}
                y={label.y + 16}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label.value.toFixed(1)}
                {compareData && ` (${label.compareValue.toFixed(1)})`}
              </SvgText>
            )}
          </G>
        ))}

        {/* Center point */}
        <Circle
          cx={center}
          cy={center}
          r={3}
          fill={chartColors.grid}
        />
      </Svg>

      {/* Legend */}
      {variant !== 'minimal' && (
        <View style={styles.legend}>
          {dimensions.map((dim) => (
            <View key={`legend-${dim}`} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendDot, 
                  { backgroundColor: chartColors[dim] }
                ]} 
              />
              <Text style={styles.legendText}>
                {dim.charAt(0).toUpperCase() + dim.slice(1)}: {(data[dim] || 0).toFixed(1)}
                {compareData && ` (${(compareData[dim] || 0).toFixed(1)})`}
              </Text>
            </View>
          ))}
          {compareData && (
            <View style={styles.legendItem}>
              <View 
                style={[
                  styles.legendDot, 
                  { backgroundColor: chartColors.compare }
                ]} 
              />
              <Text style={styles.legendText}>Previous/Average</Text>
            </View>
          )}
        </View>
      )}

      {/* Overall Score */}
      {showBalance && variant !== 'minimal' && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Balance</Text>
          <Text style={styles.scoreValue}>
            {calculateBalance(data).toFixed(0)}%
          </Text>
          {compareData && (
            <Text style={styles.compareText}>
              vs {calculateBalance(compareData).toFixed(0)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (variant === 'minimal') {
    return renderMinimal();
  }

  return renderDefault();
}

const styles = {
  container: {
    alignItems: 'center' as const,
    padding: spacing.md,
  },
  legend: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    flexWrap: 'wrap' as const,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center' as const,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    minWidth: 120,
  },
  scoreLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold as any,
    color: colors.primary,
  },
  compareText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
};