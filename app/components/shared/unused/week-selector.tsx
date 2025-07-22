// components/shared/week-selector.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface Props {
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export function WeekSelector({ currentWeek, onWeekChange }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onWeekChange(currentWeek - 1)} style={styles.navBtn}>
        <ChevronLeft size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.weekText}>Week {currentWeek}</Text>
      <TouchableOpacity onPress={() => onWeekChange(currentWeek + 1)} style={styles.navBtn}>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 12 },
  navBtn: { padding: 8, minWidth: 36, alignItems: 'center' as const },
  weekText: { fontSize: 16, fontWeight: '600' as const, color: colors.gray900, marginHorizontal: 24 },
};