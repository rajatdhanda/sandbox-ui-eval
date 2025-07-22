// components/shared/date-week-selector.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateWeekSelector({ selectedDate, onDateChange }: Props) {
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
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekSection}>
        <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.weekNavBtn}>
          <ChevronLeft size={16} color={colors.gray500} />
        </TouchableOpacity>
        <Text style={styles.weekText}>{monthName} Week {weekNumber}</Text>
        <TouchableOpacity onPress={() => changeWeek(1)} style={styles.weekNavBtn}>
          <ChevronRight size={16} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      {/* Day Navigation */}
      <View style={styles.daySection}>
        <TouchableOpacity onPress={() => changeDay(-1)} style={styles.dayNavBtn}>
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dayText}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeDay(1)} style={styles.dayNavBtn}>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Today Button */}
      <View style={styles.todaySection}>
        {!isToday ? (
          <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
            <Home size={14} color={colors.white} />
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.todayPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = {
  container: { 
    backgroundColor: colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.gray200, 
    paddingVertical: 16, 
    paddingHorizontal: 16 
  },
  weekSection: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    justifyContent: 'center' as const,
    marginBottom: 12
  },
  weekNavBtn: { 
    padding: 4,
    marginHorizontal: 8
  },
  weekText: { 
    fontSize: 14, 
    color: colors.gray600, 
    fontWeight: '500' as const,
    minWidth: 100,
    textAlign: 'center' as const
  },
  daySection: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    justifyContent: 'space-between' as const
  },
  dayNavBtn: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.gray50
  },
  dayText: { 
    fontSize: 18, 
    fontWeight: '600' as const, 
    color: colors.gray900,
    flex: 1,
    textAlign: 'center' as const
  },
  todaySection: {
    position: 'absolute' as const,
    right: 16,
    top: 16,
    minWidth: 60,
    alignItems: 'flex-end' as const
  },
  todayBtn: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    backgroundColor: colors.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    gap: 4 
  },
  todayBtnText: { 
    fontSize: 12, 
    color: colors.white, 
    fontWeight: '600' as const 
  },
  todayPlaceholder: {
    width: 60,
    height: 28
  }
};