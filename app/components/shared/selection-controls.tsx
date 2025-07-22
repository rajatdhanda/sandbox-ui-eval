// app/components/shared/selection-controls.tsx
// Path: app/components/shared/selection-controls.tsx
// Unified selection components: ChipSelector, EntitySelector, SmartSelector

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Modal 
} from 'react-native';
import { 
  CheckCircle2, 
  Circle,
  Search, 
  X, 
  Check, 
  ChevronDown 
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';

// ============================================
// ChipSelector (formerly ClassSelector)
// ============================================
interface ChipItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface ChipSelectorProps {
  items: ChipItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  displayKey?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  items,
  selectedId,
  onSelect,
  displayKey = 'name',
  variant = 'primary',
  size = 'md'
}) => {
  const sizeStyles = {
    sm: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
    md: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    lg: { paddingHorizontal: 20, paddingVertical: 10, fontSize: 16 }
  };

  return (
    <ScrollView 
      horizontal 
      style={chipStyles.container} 
      showsHorizontalScrollIndicator={false}
    >
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[
            chipStyles.chip,
            selectedId === item.id && chipStyles.chipActive,
            variant === 'secondary' && chipStyles.chipSecondary,
            selectedId === item.id && variant === 'secondary' && chipStyles.chipSecondaryActive,
            { 
              paddingHorizontal: sizeStyles[size].paddingHorizontal,
              paddingVertical: sizeStyles[size].paddingVertical 
            }
          ]}
          onPress={() => onSelect(item.id)}
        >
          <Text style={[
            chipStyles.chipText,
            selectedId === item.id && chipStyles.chipTextActive,
            { fontSize: sizeStyles[size].fontSize }
          ]}>
            {item[displayKey]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Backward compatibility export
export const ClassSelector = ChipSelector;

// ============================================
// EntitySelector (preserved as-is)
// ============================================
interface EntitySelectorProps {
  title: string;
  entities: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  getDisplayName: (entity: any) => string;
  showCheckmark?: boolean;
  maxHeight?: number;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({ 
  title, 
  entities, 
  selectedId, 
  onSelect, 
  getDisplayName,
  showCheckmark = true,
  maxHeight = 200
}) => {
  return (
    <View style={entityStyles.section}>
      <Text style={entityStyles.label}>{title}:</Text>
      <ScrollView 
        style={[entityStyles.container, { maxHeight }]} 
        nestedScrollEnabled={true}
      >
        {entities.map((entity) => (
          <TouchableOpacity
            key={entity.id}
            style={[
              entityStyles.option, 
              selectedId === entity.id && entityStyles.optionActive
            ]}
            onPress={() => onSelect(entity.id)}
          >
            <Text style={[
              entityStyles.optionText, 
              selectedId === entity.id && entityStyles.optionTextActive
            ]}>
              {getDisplayName(entity)}
            </Text>
            {showCheckmark && selectedId === entity.id && (
              <CheckCircle2 size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================
// SmartSelector (enhanced with improvements)
// ============================================
interface SmartSelectorOption {
  id: string;
  label: string;
  subtitle?: string;
  searchText?: string;
  metadata?: any;
}

interface SmartSelectorProps {
  label: string;
  value: string;
  onSelect: (value: string, option?: SmartSelectorOption) => void;
  options: SmartSelectorOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  enableQuickSelect?: boolean;
  quickSelectCount?: number;
}

export const SmartSelector: React.FC<SmartSelectorProps> = ({
  label,
  value,
  onSelect,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  searchPlaceholder = "Search options...",
  emptyText = "No options available",
  disabled = false,
  enableQuickSelect = true,
  quickSelectCount = 5
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SmartSelectorOption[]>([]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.searchText?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  const selectedOption = options.find(opt => opt.id === value);

  const handleSelectOption = (option: SmartSelectorOption) => {
    onSelect(option.id, option);
    setShowModal(false);
    setSearchTerm('');
  };

  return (
    <View style={smartStyles.container}>
      <Text style={[smartStyles.label, required && smartStyles.required]}>
        {label} {required && '*'}
      </Text>
      
      <TouchableOpacity
        style={[
          smartStyles.selectorContainer, 
          error && smartStyles.selectorContainerError,
          disabled && smartStyles.selectorContainerDisabled
        ]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
      >
        <Text style={[
          smartStyles.selectorText,
          !selectedOption && smartStyles.placeholderText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={disabled ? colors.gray400 : colors.gray600} />
      </TouchableOpacity>

      {selectedOption?.subtitle && (
        <Text style={smartStyles.selectedSubtitle}>{selectedOption.subtitle}</Text>
      )}

      {enableQuickSelect && !showModal && options.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={smartStyles.quickSelectContainer}
        >
          {options.slice(0, quickSelectCount).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                smartStyles.quickSelectItem,
                value === option.id && smartStyles.quickSelectItemSelected
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <Text style={[
                smartStyles.quickSelectText,
                value === option.id && smartStyles.quickSelectTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          {options.length > quickSelectCount && (
            <TouchableOpacity 
              style={smartStyles.moreButton} 
              onPress={() => setShowModal(true)}
            >
              <Text style={smartStyles.moreButtonText}>
                +{options.length - quickSelectCount} more
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {error && <Text style={smartStyles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={smartStyles.modalContainer}>
          <View style={smartStyles.modalHeader}>
            <Text style={smartStyles.modalTitle}>{label}</Text>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={smartStyles.closeButton}
            >
              <X size={24} color={colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={smartStyles.searchContainer}>
            <Search size={16} color={colors.gray500} style={smartStyles.searchIcon} />
            <TextInput
              style={smartStyles.searchInput}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.gray500}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                style={smartStyles.clearButton}
              >
                <X size={16} color={colors.gray500} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={smartStyles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    smartStyles.optionItem,
                    value === option.id && smartStyles.optionItemSelected
                  ]}
                  onPress={() => handleSelectOption(option)}
                >
                  <View style={smartStyles.optionContent}>
                    <Text style={[
                      smartStyles.optionLabel,
                      value === option.id && smartStyles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    {option.subtitle && (
                      <Text style={[
                        smartStyles.optionSubtitle,
                        value === option.id && smartStyles.optionSubtitleSelected
                      ]}>
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                  {value === option.id && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={smartStyles.emptyContainer}>
                <Text style={smartStyles.emptyText}>
                  {searchTerm ? `No results for "${searchTerm}"` : emptyText}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ============================================
// Styles
// ============================================
const chipStyles = {
  container: { 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.sm, 
    maxHeight: 60 
  },
  chip: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.full, 
    marginRight: spacing.sm, 
    borderWidth: 1,
    borderColor: colors.gray200,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  chipActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  chipSecondary: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
  },
  chipSecondaryActive: {
    backgroundColor: colors.gray800,
    borderColor: colors.gray800,
  },
  chipText: { 
    color: colors.gray600,
    fontWeight: typography.medium as any,
  },
  chipTextActive: { 
    color: colors.white, 
    fontWeight: typography.semibold as any,
  },
};

const entityStyles = {
  section: { 
    marginBottom: spacing.xl 
  },
  label: { 
    fontSize: typography.md, 
    fontWeight: typography.semibold as any, 
    color: colors.textPrimary, 
    marginBottom: spacing.md, 
    textTransform: 'capitalize' as any 
  },
  container: { 
    borderRadius: borderRadius.lg, 
    borderWidth: 1, 
    borderColor: colors.gray200, 
    backgroundColor: colors.white 
  },
  option: { 
    flexDirection: 'row' as const, 
    justifyContent: 'space-between' as const, 
    alignItems: 'center' as const, 
    padding: spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.gray100 
  },
  optionActive: { 
    backgroundColor: colors.blue50, 
    borderBottomColor: colors.blue100 
  },
  optionText: { 
    fontSize: typography.md, 
    color: colors.textPrimary, 
    flex: 1 
  },
  optionTextActive: { 
    color: colors.primary, 
    fontWeight: typography.semibold as any 
  },
};

const smartStyles = {
  container: {
    marginBottom: spacing.lg
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  required: {
    color: colors.textPrimary
  },
  selectorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    padding: spacing.md
  },
  selectorContainerError: {
    borderColor: colors.error
  },
  selectorContainerDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200
  },
  selectorText: {
    fontSize: typography.md,
    color: colors.textPrimary,
    flex: 1
  },
  placeholderText: {
    color: colors.gray500,
    fontStyle: 'italic' as const
  },
  selectedSubtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.md
  },
  quickSelectContainer: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs
  },
  quickSelectItem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 80,
    alignItems: 'center' as const
  },
  quickSelectItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50
  },
  quickSelectText: {
    fontSize: typography.xs,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
    textAlign: 'center' as const
  },
  quickSelectTextSelected: {
    color: colors.primary
  },
  moreButton: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minWidth: 60
  },
  moreButtonText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium as any
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.xs
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary
  },
  closeButton: {
    padding: spacing.sm
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    margin: spacing.lg,
    paddingHorizontal: spacing.md
  },
  searchIcon: {
    marginRight: spacing.sm
  },
  searchInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.md,
    color: colors.textPrimary
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm
  },
  optionsList: {
    flex: 1
  },
  optionItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  optionItemSelected: {
    backgroundColor: colors.blue50
  },
  optionContent: {
    flex: 1
  },
  optionLabel: {
    fontSize: typography.md,
    fontWeight: typography.medium as any,
    color: colors.textPrimary
  },
  optionLabelSelected: {
    color: colors.primary
  },
  optionSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  optionSubtitleSelected: {
    color: colors.primary
  },
  emptyContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center' as const
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic' as const
  }
};