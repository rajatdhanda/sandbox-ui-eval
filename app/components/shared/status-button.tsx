// components/shared/status-button.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { colors } from '@/lib/styles';
import { buttonStyles } from './button-styles';

interface Props {
  status: 'present' | 'late' | 'absent';
  isSelected: boolean;
  onPress: () => void;
}

export function StatusButton({ status, isSelected, onPress }: Props) {
const getColors = () => {
  switch(status) {
    case 'present': 
      return { 
        border: colors.primary, 
        bg: isSelected ? colors.primary : colors.white,
        text: isSelected ? colors.white : colors.primary
      };
    case 'late': 
      return { 
        border: '#F59E0B', 
        bg: isSelected ? '#F59E0B' : colors.white,
        text: isSelected ? colors.white : '#F59E0B'
      };
    case 'absent': 
      return { 
        border: colors.secondary, 
        bg: isSelected ? colors.secondary : colors.white,
        text: isSelected ? colors.white : colors.secondary
      };
  }
};
  
  const Icon = status === 'present' ? CheckCircle2 : status === 'late' ? Clock : XCircle;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorConfig = getColors();
  
  return (
    <TouchableOpacity
      style={[buttonStyles.compact, { 
        borderColor: colorConfig.border,
        backgroundColor: colorConfig.bg,
        minWidth: 75,
      }]}
      onPress={onPress}
    >
      <Icon size={14} color={colorConfig.text} />
      <Text style={[buttonStyles.textSmall, { color: colorConfig.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}