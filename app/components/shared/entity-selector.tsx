// components/shared/entity-selector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface EntitySelectorProps {
  title: string;
  entities: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  getDisplayName: (entity: any) => string;
}

export function EntitySelector({ 
  title, entities, selectedId, onSelect, getDisplayName 
}: EntitySelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}:</Text>
      <ScrollView style={styles.container} nestedScrollEnabled={true}>
        {entities.map((entity) => (
          <TouchableOpacity
            key={entity.id}
            style={[styles.option, selectedId === entity.id && styles.optionActive]}
            onPress={() => onSelect(entity.id)}
          >
            <Text style={[styles.optionText, selectedId === entity.id && styles.optionTextActive]}>
              {getDisplayName(entity)}
            </Text>
            {selectedId === entity.id && <CheckCircle2 size={16} color={colors.blue600} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600' as const, color: '#374151', marginBottom: 12, textTransform: 'capitalize' as const },
  container: { maxHeight: 200, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: colors.white },
  option: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionActive: { backgroundColor: '#EFF6FF', borderBottomColor: '#DBEAFE' },
  optionText: { fontSize: 15, color: '#374151', flex: 1 },
  optionTextActive: { color: '#2563EB', fontWeight: '600' as const },
};