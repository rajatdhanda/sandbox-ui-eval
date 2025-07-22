// components/shared/date-selector.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '@/lib/styles';
import { buttonStyles } from './button-styles';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onDateChange }: Props) {
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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
        <Text style={styles.navText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dateBtn}>
        <Calendar size={16} color={colors.primary} />
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
        <Text style={styles.navText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
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