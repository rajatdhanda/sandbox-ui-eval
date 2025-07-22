// app/components/shared/date-time-controls.tsx
// Path: app/components/shared/date-time-controls.tsx
// Unified date and time selection components with improvements

import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Home, Clock, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';
import { buttonStyles } from './button-styles';

// ============================================
// DateSelector (from date-selector.tsx)
// ============================================
interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric' 
    });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    onDateChange(date.toISOString().split('T')[0]);
  };

  return (
    <View style={dateStyles.container}>
      <TouchableOpacity onPress={() => changeDate(-1)} style={dateStyles.navBtn}>
        <Text style={dateStyles.navText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={dateStyles.dateBtn}>
        <Calendar size={16} color={colors.primary} />
        <Text style={dateStyles.dateText}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeDate(1)} style={dateStyles.navBtn}>
        <Text style={dateStyles.navText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const dateStyles = {
  container: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 12, paddingHorizontal: 16 },
  navBtn: { padding: 12, minWidth: 40, alignItems: 'center' as const },
  navText: { fontSize: 20, color: colors.primary, fontWeight: '600' as const },
  dateBtn: [buttonStyles.standard, { 
    backgroundColor: colors.white, 
    borderColor: colors.gray200, 
    paddingHorizontal: 16,
    paddingVertical: 8,
  }],
  dateText: [buttonStyles.text, { color: colors.gray900 }],
};

// ============================================
// DateWeekSelector (from date-week-selector.tsx)
// ============================================
interface DateWeekSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateWeekSelector({ selectedDate, onDateChange }: DateWeekSelectorProps) {
  const date = new Date(selectedDate);
  const weekNumber = Math.ceil(date.getDate() / 7);
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  
  const changeDay = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const changeWeek = (weeks: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <View style={weekStyles.container}>
      {/* Week Navigation */}
      <View style={weekStyles.weekSection}>
        <TouchableOpacity onPress={() => changeWeek(-1)} style={weekStyles.weekNavBtn}>
          <ChevronLeft size={16} color={colors.gray500} />
        </TouchableOpacity>
        <Text style={weekStyles.weekText}>{monthName} Week {weekNumber}</Text>
        <TouchableOpacity onPress={() => changeWeek(1)} style={weekStyles.weekNavBtn}>
          <ChevronRight size={16} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      {/* Day Navigation */}
      <View style={weekStyles.daySection}>
        <TouchableOpacity onPress={() => changeDay(-1)} style={weekStyles.dayNavBtn}>
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={weekStyles.dayText}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeDay(1)} style={weekStyles.dayNavBtn}>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Today Button */}
      <View style={weekStyles.todaySection}>
        {!isToday && (
          <TouchableOpacity onPress={goToToday} style={weekStyles.todayButton}>
            <Home size={16} color={colors.primary} />
            <Text style={weekStyles.todayText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const weekStyles = {
  container: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  weekSection: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: 12 },
  weekNavBtn: { padding: 8 },
  weekText: { fontSize: 12, color: colors.gray500, marginHorizontal: 16 },
  daySection: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 8 },
  dayNavBtn: { padding: 12 },
  dayText: { fontSize: 16, fontWeight: '600' as const, color: colors.gray900, minWidth: 200, textAlign: 'center' as const },
  todaySection: { paddingBottom: 8, alignItems: 'center' as const },
  todayButton: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: colors.primary + '10', borderRadius: 12, gap: 4 },
  todayText: { fontSize: 12, color: colors.primary, fontWeight: '500' as const },
};

// ============================================
// TimeSchedule (from time-schedule.tsx) - FIXED
// ============================================
interface TimeSlot {
  id: string;
  time: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

interface TimeScheduleProps {
  timeSlots: TimeSlot[];
  onAddActivity: (time: string) => void;
  startHour?: number;
  endHour?: number;
  interval?: number; // in minutes
}

export function TimeSchedule({ 
  timeSlots, 
  onAddActivity,
  startHour = 9,
  endHour = 18,
  interval = 30 
}: TimeScheduleProps) {
  // Generate time slots based on interval (30-minute default like original)
  const times = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }
  
  return (
    <ScrollView style={scheduleStyles.container} showsVerticalScrollIndicator={false}>
      {times.map(time => {
        const activity = timeSlots.find(slot => slot.time === time);
        
        return (
          <View key={time} style={scheduleStyles.timeRow}>
            <View style={scheduleStyles.timeLabel}>
              <Text style={scheduleStyles.time}>{time}</Text>
            </View>
            
            <View style={scheduleStyles.activityContainer}>
              {activity ? (
                <View style={[scheduleStyles.activityCard, activity.isCompleted && scheduleStyles.completedCard]}>
                  <TouchableOpacity onPress={activity.onToggle} style={scheduleStyles.activityHeader}>
                    {activity.isCompleted ? (
                      <CheckCircle2 size={20} color={colors.success} />
                    ) : (
                      <Circle size={20} color={colors.gray400} />
                    )}
                    <View style={scheduleStyles.activityInfo}>
                      <Text style={[scheduleStyles.activityTitle, activity.isCompleted && scheduleStyles.completedText]}>
                        {activity.title}
                      </Text>
                      {activity.description && (
                        <Text style={[scheduleStyles.activityDesc, activity.isCompleted && scheduleStyles.completedText]}>
                          {activity.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {activity.onDelete && (
                    <TouchableOpacity onPress={activity.onDelete} style={scheduleStyles.deleteBtn}>
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={scheduleStyles.addButton} onPress={() => onAddActivity(time)}>
                  <Plus size={16} color={colors.primary} />
                  <Text style={scheduleStyles.addText}>Add Activity</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const scheduleStyles = {
  container: { flex: 1, padding: 20 },
  timeRow: { flexDirection: 'row' as const, marginBottom: 8, minHeight: 50 },
  timeLabel: { width: 50, paddingTop: 14 },
  time: { fontSize: 14, color: colors.gray600, fontWeight: '500' as const },
  activityContainer: { flex: 1, marginLeft: 12 },
  activityCard: { 
    backgroundColor: colors.white, 
    borderRadius: 12, 
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  completedCard: { backgroundColor: colors.gray50, opacity: 0.8 },
  activityHeader: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const,
    flex: 1,
  },
  activityInfo: { marginLeft: 12, flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.gray900 },
  activityDesc: { fontSize: 14, color: colors.gray600, marginTop: 2 },
  completedText: { textDecorationLine: 'line-through' as const, color: colors.gray400 },
  deleteBtn: { padding: 8, marginLeft: 8 },
  addButton: { 
    borderStyle: 'dashed' as const, 
    borderWidth: 1, 
    borderColor: colors.gray300, 
    borderRadius: 12, 
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    justifyContent: 'center' as const, 
    gap: 8,
    minHeight: 44,
  },
  addText: { fontSize: 14, color: colors.primary, fontWeight: '500' as const },
};

// ============================================
// NEW: Unified DateTimePicker
// ============================================
interface DateTimePickerProps {
  mode: 'date' | 'week' | 'month';
  selectedDate: string;
  onDateChange: (date: string) => void;
  showTimePicker?: boolean;
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
}

export function DateTimePicker({ 
  mode, 
  selectedDate, 
  onDateChange, 
  showTimePicker, 
  selectedTime, 
  onTimeChange 
}: DateTimePickerProps) {
  if (mode === 'week') {
    return <DateWeekSelector selectedDate={selectedDate} onDateChange={onDateChange} />;
  }
  
  // Default to date mode
  return <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />;
}

// ============================================
// NEW: Time Range Picker for duration-based scheduling
// ============================================
interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onTimeRangeChange: (start: string, end: string) => void;
}

export function TimeRangePicker({ startTime, endTime, onTimeRangeChange }: TimeRangePickerProps) {
  const duration = calculateDuration(startTime, endTime);
  
  return (
    <View style={rangeStyles.container}>
      <TouchableOpacity style={rangeStyles.timeButton}>
        <Text style={rangeStyles.label}>Start</Text>
        <Text style={rangeStyles.time}>{startTime}</Text>
      </TouchableOpacity>
      
      <View style={rangeStyles.duration}>
        <Clock size={16} color={colors.gray500} />
        <Text style={rangeStyles.durationText}>{duration}</Text>
      </View>
      
      <TouchableOpacity style={rangeStyles.timeButton}>
        <Text style={rangeStyles.label}>End</Text>
        <Text style={rangeStyles.time}>{endTime}</Text>
      </TouchableOpacity>
    </View>
  );
}

const rangeStyles = {
  container: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    justifyContent: 'space-around' as const,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  timeButton: {
    alignItems: 'center' as const,
    padding: spacing.sm,
  },
  label: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  duration: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
};

// ============================================
// Helper Functions
// ============================================
function calculateDuration(start: string, end: string): string {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} minutes`;
}

// ============================================
// NEW: Week View for multiple days
// ============================================
interface WeekViewProps {
  startDate: string;
  activities: Array<{
    date: string;
    time: string;
    title: string;
    duration: number; // in minutes
  }>;
  onActivityClick?: (activity: any) => void;
}

export function WeekView({ startDate, activities, onActivityClick }: WeekViewProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM to 6 PM
  
  const getActivityForSlot = (day: number, hour: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];
    
    return activities.find(a => 
      a.date === dateStr && 
      parseInt(a.time.split(':')[0]) === hour
    );
  };
  
  return (
    <ScrollView style={weekViewStyles.container}>
      <View style={weekViewStyles.header}>
        <View style={weekViewStyles.timeColumn} />
        {days.map((day, index) => (
          <View key={day} style={weekViewStyles.dayHeader}>
            <Text style={weekViewStyles.dayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      <ScrollView style={weekViewStyles.body}>
        {hours.map(hour => (
          <View key={hour} style={weekViewStyles.row}>
            <View style={weekViewStyles.timeColumn}>
              <Text style={weekViewStyles.timeText}>
                {`${hour.toString().padStart(2, '0')}:00`}
              </Text>
            </View>
            {days.map((_, dayIndex) => {
              const activity = getActivityForSlot(dayIndex, hour);
              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={weekViewStyles.cell}
                  onPress={() => activity && onActivityClick?.(activity)}
                >
                  {activity && (
                    <View style={weekViewStyles.activity}>
                      <Text style={weekViewStyles.activityText} numberOfLines={1}>
                        {activity.title}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const weekViewStyles = {
  container: { flex: 1 },
  header: { 
    flexDirection: 'row' as const, 
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  body: { flex: 1 },
  row: { flexDirection: 'row' as const, minHeight: 60 },
  timeColumn: { width: 60, padding: spacing.sm },
  timeText: { fontSize: typography.xs, color: colors.textSecondary },
  dayHeader: { 
    flex: 1, 
    padding: spacing.sm, 
    alignItems: 'center' as const,
  },
  dayText: { 
    fontSize: typography.sm, 
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
  },
  cell: { 
    flex: 1, 
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray100,
    padding: spacing.xs,
  },
  activity: {
    backgroundColor: colors.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activityText: {
    fontSize: typography.xs,
    color: colors.textPrimary,
  },
};