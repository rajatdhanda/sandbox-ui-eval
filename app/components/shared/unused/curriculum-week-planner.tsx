// components/shared/curriculum-week-planner.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Calendar, Clock, Plus, CheckCircle2, Circle } from 'lucide-react-native';
import { colors } from '@/lib/styles';
import { CurriculumService } from '@/lib/supabase/services/curriculum.service';

interface WeekPlannerProps {
  curriculumId?: string;
  weekNumber: number;
  onWeekChange: (week: number) => void;
  onActivityPress: (activity: any) => void;
  onAddActivity: (day: number) => void;
  classId?: string;
}

export const CurriculumWeekPlanner = ({ 
  curriculumId, 
  weekNumber, 
  onWeekChange, 
  onActivityPress, 
  onAddActivity,
  classId 
}: WeekPlannerProps) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchWeekActivities();
  }, [weekNumber, curriculumId]);

  const fetchWeekActivities = async () => {
    setLoading(true);
    try {
      const result = await CurriculumService.getItemsByWeek(weekNumber, curriculumId);
      if (result.success) {
        setActivities(result.data || []);
        console.log(`[WEEK_PLANNER] Loaded ${result.data?.length || 0} activities for week ${weekNumber}`);
      }
    } catch (error) {
      console.error('[WEEK_PLANNER] Error fetching activities:', error);
    }
    setLoading(false);
  };

  const groupActivitiesByDay = () => {
    const grouped: Record<number, any[]> = {};
    for (let i = 1; i <= 5; i++) {
      grouped[i] = activities.filter(activity => activity.day_number === i);
    }
    return grouped;
  };

  const toggleActivityCompletion = (activityId: string) => {
    const newCompleted = new Set(completedActivities);
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId);
    } else {
      newCompleted.add(activityId);
    }
    setCompletedActivities(newCompleted);
    
    // Here you would typically save to execution records
    console.log(`[WEEK_PLANNER] Activity ${activityId} completion toggled`);
  };

  const renderActivity = (activity: any) => {
    const isCompleted = completedActivities.has(activity.id);
    
    return (
      <TouchableOpacity
        key={activity.id}
        style={[styles.activityCard, isCompleted && styles.completedActivity]}
        onPress={() => onActivityPress(activity)}
      >
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, isCompleted && styles.completedText]}>
            {activity.title}
          </Text>
          <TouchableOpacity onPress={() => toggleActivityCompletion(activity.id)}>
            {isCompleted ? (
              <CheckCircle2 size={20} color={colors.success} />
            ) : (
              <Circle size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.activityDescription, isCompleted && styles.completedText]}>
          {activity.description || activity.activity_type}
        </Text>
        
        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.gray500} />
            <Text style={styles.metaText}>{activity.estimated_duration || 30}min</Text>
          </View>
          <Text style={styles.difficultyBadge}>{activity.difficulty_level || 'basic'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDay = (dayNumber: number, dayName: string) => {
    const dayActivities = groupActivitiesByDay()[dayNumber] || [];
    
    return (
      <View key={dayNumber} style={styles.dayColumn}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dayNumber}>Day {dayNumber}</Text>
        </View>
        
        <ScrollView style={styles.dayContent} showsVerticalScrollIndicator={false}>
          {dayActivities.map(renderActivity)}
          
          <TouchableOpacity
            style={styles.addActivityButton}
            onPress={() => onAddActivity(dayNumber)}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addActivityText}>Add Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Week selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity 
          style={styles.weekButton}
          onPress={() => onWeekChange(Math.max(1, weekNumber - 1))}
        >
          <Text style={styles.weekButtonText}>← Week {weekNumber - 1}</Text>
        </TouchableOpacity>
        
        <View style={styles.currentWeek}>
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.currentWeekText}>Week {weekNumber}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.weekButton}
          onPress={() => onWeekChange(weekNumber + 1)}
        >
          <Text style={styles.weekButtonText}>Week {weekNumber + 1} →</Text>
        </TouchableOpacity>
      </View>

      {/* Week grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekGrid}>
        {dayNames.map((dayName, index) => renderDay(index + 1, dayName))}
      </ScrollView>

      {/* Week summary */}
      <View style={styles.weekSummary}>
        <Text style={styles.summaryText}>
          {activities.length} activities planned • {completedActivities.size} completed
        </Text>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray50
  },
  weekSelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  weekButton: {
    padding: 8
  },
  weekButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500' as const
  },
  currentWeek: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8
  },
  currentWeekText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray900
  },
  weekGrid: {
    flex: 1,
    paddingHorizontal: 16
  },
  dayColumn: {
    width: 250,
    marginRight: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden'
  },
  dayHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.gray50
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray900
  },
  dayNumber: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2
  },
  dayContent: {
    flex: 1,
    padding: 12
  },
  activityCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  completedActivity: {
    backgroundColor: colors.green50,
    borderColor: colors.green200
  },
  activityHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray900,
    flex: 1
  },
  activityDescription: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 8
  },
  completedText: {
    textDecorationLine: 'line-through' as const,
    opacity: 0.7
  },
  activityMeta: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4
  },
  metaText: {
    fontSize: 11,
    color: colors.gray500
  },
  difficultyBadge: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.purple50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500' as const
  },
  addActivityButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed' as const,
    marginTop: 8
  },
  addActivityText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500' as const
  },
  weekSummary: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center' as const
  }
};