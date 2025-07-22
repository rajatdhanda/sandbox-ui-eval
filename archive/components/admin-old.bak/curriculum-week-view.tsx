// components/admin/curriculum-week-view.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, CheckCircle2, Circle } from 'lucide-react-native';
import { db } from '@/lib/supabase/services/database.service';
import { colors } from '@/lib/styles';

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  day_number: number;
  week_number: number;
  time_slot?: { name: string; start_time: string };
  is_completed?: boolean;
}

export function CurriculumWeekView() {
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCurriculum(); }, [selectedWeek]);

  const fetchCurriculum = async () => {
    setLoading(true);
    const { data } = await db.read('curriculum_items', {
      select: `*, time_slot:time_slots(*), executions:curriculum_executions(*)`,
      filters: { week_number: selectedWeek, is_active: true },
      orderBy: [{ column: 'day_number' }, { column: 'time_slot_id' }]
    });

    const enrichedItems = (data || []).map((item: any) => ({
      ...item,
      is_completed: item.executions?.some((exec: any) => exec.completion_status === 'completed')
    }));

    setItems(enrichedItems);
    setLoading(false);
  };

  const toggleComplete = async (itemId: string, isCompleted: boolean) => {
    if (isCompleted) {
      await db.delete('curriculum_executions', { curriculum_item_id: itemId });
    } else {
      await db.create('curriculum_executions', {
        curriculum_item_id: itemId,
        execution_date: new Date().toISOString().split('T')[0],
        completion_status: 'completed',
        teacher_id: 'current_user' // Replace with actual user ID
      });
    }
    fetchCurriculum();
  };

  const groupedByDay = items.reduce((acc, item) => {
    const day = item.day_number;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, CurriculumItem[]>);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color={colors.primary} />
        <Text style={styles.title}>Week {selectedWeek} Curriculum</Text>
      </View>

      <ScrollView horizontal style={styles.weekSelector} showsHorizontalScrollIndicator={false}>
        {[1, 2, 3, 4].map(week => (
          <TouchableOpacity
            key={week}
            style={[styles.weekChip, selectedWeek === week && styles.weekChipActive]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={[styles.weekChipText, selectedWeek === week && styles.weekChipTextActive]}>
              Week {week}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {Object.entries(groupedByDay).map(([day, dayItems]) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayTitle}>{dayNames[Number(day) - 1]}</Text>
            {dayItems.map(item => (
              <View key={item.id} style={styles.curriculumCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => toggleComplete(item.id, item.is_completed || false)}
                    style={styles.checkButton}
                  >
                    {item.is_completed ? 
                      <CheckCircle2 size={20} color={colors.green600} /> : 
                      <Circle size={20} color={colors.gray400} />
                    }
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemDescription}>{item.description}</Text>
                {item.time_slot && (
                  <View style={styles.timeSlot}>
                    <Clock size={14} color={colors.gray500} />
                    <Text style={styles.timeText}>{item.time_slot.name} - {item.time_slot.start_time}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600' as const, color: '#1F2937', marginLeft: 12 },
  weekSelector: { padding: 20, maxHeight: 60 },
  weekChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.white, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  weekChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekChipText: { fontSize: 14, color: '#6B7280' },
  weekChipTextActive: { color: colors.white, fontWeight: '600' as const },
  content: { flex: 1, padding: 20 },
  daySection: { marginBottom: 24 },
  dayTitle: { fontSize: 16, fontWeight: '600' as const, color: '#1F2937', marginBottom: 12 },
  curriculumCard: { backgroundColor: colors.white, padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600' as const, color: '#1F2937', flex: 1 },
  checkButton: { padding: 4 },
  itemDescription: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  timeSlot: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  timeText: { fontSize: 12, color: '#6B7280' },
};