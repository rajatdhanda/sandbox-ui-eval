// components/shared/time-schedule.tsx
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface TimeSlot {
  id: string;
  time: string;
  title: string;
  description: string;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

interface Props {
  timeSlots: TimeSlot[];
  onAddActivity: (time: string) => void;
}

export function TimeSchedule({ timeSlots, onAddActivity }: Props) {
  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {times.map(time => {
        const slotForTime = timeSlots.find(slot => slot.time === time);
        
        return (
          <View key={time} style={styles.timeRow}>
            <Text style={styles.timeLabel}>{time}</Text>
            <View style={styles.activityContainer}>
              {slotForTime ? (
                <View style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>{slotForTime.title}</Text>
                    <View style={styles.activityActions}>
                      <TouchableOpacity onPress={slotForTime.onToggle}>
                        {slotForTime.isCompleted ? 
                          <CheckCircle2 size={18} color={colors.green600} /> : 
                          <Circle size={18} color={colors.gray400} />
                        }
                      </TouchableOpacity>
                      <TouchableOpacity onPress={slotForTime.onDelete} style={styles.deleteBtn}>
                        <Trash2 size={16} color={colors.red600} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.activityDesc}>{slotForTime.description}</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.emptySlot}
                  onPress={() => onAddActivity(time)}
                >
                  <Plus size={16} color={colors.gray400} />
                  <Text style={styles.emptyText}>Add Activity</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = {
  container: { flex: 1, padding: 16 },
  timeRow: { flexDirection: 'row' as const, marginBottom: 8, minHeight: 60 },
  timeLabel: { width: 60, fontSize: 14, color: colors.gray500, fontWeight: '600' as const, paddingTop: 8 },
  activityContainer: { flex: 1, marginLeft: 12 },
  activityCard: { backgroundColor: colors.white, padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  activityHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6 },
  activityTitle: { fontSize: 14, fontWeight: '600' as const, color: colors.gray900, flex: 1 },
  activityActions: { flexDirection: 'row' as const, gap: 8 },
  deleteBtn: { padding: 2 },
  activityDesc: { fontSize: 12, color: colors.gray500, lineHeight: 16 },
  emptySlot: { height: 50, flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: colors.gray50, borderRadius: 8, borderStyle: 'dashed' as const, borderWidth: 1, borderColor: colors.gray200, gap: 6 },
  emptyText: { fontSize: 12, color: colors.gray400 },
};