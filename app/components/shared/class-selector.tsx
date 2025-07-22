// components/shared/class-selector.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { colors } from '@/lib/styles';
import { buttonStyles } from './button-styles';

interface Class {
  id: string;
  name: string;
}

interface Props {
  classes: Class[];
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClass, onClassChange }: Props) {
  return (
    <ScrollView horizontal style={styles.container} showsHorizontalScrollIndicator={false}>
      {classes.map(cls => (
        <TouchableOpacity
          key={cls.id}
          style={[styles.chip, selectedClass === cls.id && styles.chipActive]}
          onPress={() => onClassChange(cls.id)}
        >
          <Text style={[styles.chipText, selectedClass === cls.id && styles.chipTextActive]}>
            {cls.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = {
  container: { paddingHorizontal: 16, paddingVertical: 8, maxHeight: 60 },
  chip: [buttonStyles.standard, { 
    backgroundColor: colors.white, 
    borderRadius: 20, 
    marginRight: 8, 
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  }],
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: [buttonStyles.text, { color: colors.gray500 }],
  chipTextActive: [buttonStyles.text, { color: colors.white, fontWeight: '600' as const }],
};