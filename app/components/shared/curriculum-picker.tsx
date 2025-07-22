// components/shared/curriculum-picker.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, BookOpen } from 'lucide-react-native';
import { colors } from '@/lib/styles';
import { buttonStyles } from './button-styles';

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: CurriculumItem[];
  onSelect: (item: CurriculumItem) => void;
}

export function CurriculumPicker({ visible, onClose, items, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Activity</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => onSelect(item)}
            >
              <BookOpen size={20} color={colors.primary} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  title: { fontSize: 18, fontWeight: '600' as const, color: colors.gray900 },
  content: { flex: 1, padding: 16 },
  itemCard: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 16, backgroundColor: colors.gray50, borderRadius: 8, marginBottom: 8 },
  itemContent: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600' as const, color: colors.gray900 },
  itemDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
};