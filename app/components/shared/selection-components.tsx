// app/components/shared/selection-components.tsx
// Path: app/components/shared/selection-components.tsx
// Unified selection components with best features from both implementations

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Modal,
  StyleSheet
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
// Shared Types
// ============================================
interface SelectionItem {
  id: string;
  label?: string;
  name?: string;
  subtitle?: string;
  searchText?: string;
  metadata?: any;
}

// ============================================
// ChipSelector - Compact horizontal selector
// ============================================
interface ChipSelectorProps {
  items: SelectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  displayKey?: 'name' | 'label';
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
  const sizeMap = {
    sm: { px: 12, py: 6, fontSize: 12 },
    md: { px: 16, py: 8, fontSize: 14 },
    lg: { px: 20, py: 10, fontSize: 16 }
  };
  const sz = sizeMap[size];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
      {items.map(item => {
        const isSelected = selectedId === item.id;
        const isPrimary = variant === 'primary';
        
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chip,
              { paddingHorizontal: sz.px, paddingVertical: sz.py },
              isSelected && (isPrimary ? styles.chipPrimaryActive : styles.chipSecondaryActive),
              !isSelected && !isPrimary && styles.chipSecondary
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[
              styles.chipText,
              { fontSize: sz.fontSize },
              isSelected && styles.chipTextActive
            ]}>
              {item[displayKey] || item.label || item.name || 'Unnamed'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// Backward compatibility
export const ClassSelector = ChipSelector;

// ============================================
// EntitySelector - Vertical list selector
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
}) => (
  <View style={styles.entitySection}>
    <Text style={styles.entityLabel}>{title}:</Text>
    <ScrollView style={[styles.entityList, { maxHeight }]} nestedScrollEnabled>
      {entities.map(entity => {
        const isSelected = selectedId === entity.id;
        return (
          <TouchableOpacity
            key={entity.id}
            style={[styles.entityItem, isSelected && styles.entityItemActive]}
            onPress={() => onSelect(entity.id)}
          >
            <Text style={[styles.entityText, isSelected && styles.entityTextActive]}>
              {getDisplayName(entity)}
            </Text>
            {showCheckmark && isSelected && <CheckCircle2 size={16} color={colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ============================================
// SmartSelector - Advanced selector with search
// ============================================
interface SmartSelectorProps {
  label: string;
  value: string;
  onSelect: (value: string, option?: SelectionItem) => void;
  options: SelectionItem[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  mode?: 'dropdown' | 'search' | 'hybrid';
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
  searchPlaceholder = "Search...",
  emptyText = "No options available",
  disabled = false,
  mode = 'hybrid',
  enableQuickSelect = true,
  quickSelectCount = 5
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter options based on search
  const filteredOptions = searchTerm.trim() 
    ? options.filter(opt => {
        const term = searchTerm.toLowerCase();
        return (
          opt.label?.toLowerCase().includes(term) ||
          opt.name?.toLowerCase().includes(term) ||
          opt.subtitle?.toLowerCase().includes(term) ||
          opt.searchText?.toLowerCase().includes(term)
        );
      })
    : options;

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption?.label || selectedOption?.name || '';

  const handleSelect = (option: SelectionItem) => {
    onSelect(option.id, option);
    setSearchTerm('');
    setIsSearching(false);
    setShowModal(false);
  };

  const handleClear = () => {
    onSelect('', undefined);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleInputChange = (text: string) => {
    setSearchTerm(text);
    if (mode === 'search' || mode === 'hybrid') {
      setIsSearching(text.length > 0 || (!text && selectedOption));
    }
  };

  // Render quick select pills
  const renderQuickSelect = () => {
    if (!enableQuickSelect || showModal || options.length === 0) return null;
    
    const showOptions = isSearching ? filteredOptions : options;
    const displayOptions = showOptions.slice(0, quickSelectCount);
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickContainer}>
        {isSearching && selectedOption && searchTerm === '' && (
          <TouchableOpacity style={styles.clearPill} onPress={handleClear}>
            <Text style={styles.clearPillText}>Clear</Text>
          </TouchableOpacity>
        )}
        
        {displayOptions.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.quickPill, value === opt.id && styles.quickPillActive]}
            onPress={() => handleSelect(opt)}
          >
            <Text style={[styles.quickText, value === opt.id && styles.quickTextActive]}>
              {opt.label || opt.name}
            </Text>
          </TouchableOpacity>
        ))}
        
        {showOptions.length > quickSelectCount && (
          <TouchableOpacity style={styles.morePill} onPress={() => setShowModal(true)}>
            <Text style={styles.moreText}>+{showOptions.length - quickSelectCount}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, required && styles.required]}>
        {label} {required && '*'}
      </Text>
      
      <View style={[styles.selector, error && styles.selectorError, disabled && styles.selectorDisabled]}>
        {mode === 'dropdown' ? (
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => !disabled && setShowModal(true)}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !selectedOption && styles.placeholder]}>
              {displayValue || placeholder}
            </Text>
            <ChevronDown size={16} color={disabled ? colors.gray400 : colors.gray600} />
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={isSearching ? searchTerm : displayValue}
              onChangeText={handleInputChange}
              placeholder={placeholder}
              editable={!disabled}
              placeholderTextColor={colors.gray500}
            />
            <TouchableOpacity onPress={() => setShowModal(true)} disabled={disabled}>
              <ChevronDown size={16} color={disabled ? colors.gray400 : colors.gray600} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {selectedOption?.subtitle && !isSearching && (
        <Text style={styles.subtitle}>{selectedOption.subtitle}</Text>
      )}

      {renderQuickSelect()}

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={16} color={colors.gray500} />
            <TextInput
              style={styles.modalSearch}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.gray500}
              autoFocus
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <X size={16} color={colors.gray500} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.optionList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = value === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.option, isSelected && styles.optionActive]}
                    onPress={() => handleSelect(option)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                        {option.label || option.name}
                      </Text>
                      {option.subtitle && (
                        <Text style={[styles.optionSubtitle, isSelected && styles.optionSubtitleActive]}>
                          {option.subtitle}
                        </Text>
                      )}
                    </View>
                    {isSelected && <Check size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
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
// Unified Styles
// ============================================
const styles = StyleSheet.create({
  // Shared
  container: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '500', color: colors.gray700, marginBottom: 6 },
  required: { color: colors.gray900 },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
  
  // ChipSelector
  chipContainer: { paddingVertical: spacing.sm, maxHeight: 60 },
  chip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    minWidth: 80,
    alignItems: 'center'
  },
  chipPrimaryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipSecondary: { backgroundColor: colors.gray100, borderColor: colors.gray300 },
  chipSecondaryActive: { backgroundColor: colors.gray800, borderColor: colors.gray800 },
  chipText: { color: colors.gray600, fontWeight: '500' },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  
  // EntitySelector
  entitySection: { marginBottom: spacing.xl },
  entityLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: colors.textPrimary, 
    marginBottom: spacing.md,
    textTransform: 'capitalize'
  },
  entityList: { borderRadius: 8, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white },
  entityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  entityItemActive: { backgroundColor: colors.blue50 },
  entityText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  entityTextActive: { color: colors.primary, fontWeight: '600' },
  
  // SmartSelector
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 12
  },
  selectorError: { borderColor: colors.error },
  selectorDisabled: { backgroundColor: colors.gray100, borderColor: colors.gray200 },
  dropdownButton: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  selectorText: { fontSize: 16, color: colors.gray900 },
  placeholder: { color: colors.gray500, fontStyle: 'italic' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.gray900 },
  subtitle: { fontSize: 12, color: colors.gray500, marginTop: 4, marginLeft: 12 },
  
  // Quick Select
  quickContainer: { marginTop: 8, paddingVertical: 4 },
  quickPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center'
  },
  quickPillActive: { borderColor: colors.primary, backgroundColor: colors.blue50 },
  quickText: { fontSize: 12, fontWeight: '500', color: colors.gray700 },
  quickTextActive: { color: colors.primary },
  clearPill: { backgroundColor: colors.error, borderRadius: 6, padding: 8, marginRight: 8 },
  clearPillText: { fontSize: 12, fontWeight: '500', color: colors.white },
  morePill: { backgroundColor: colors.gray100, borderRadius: 6, padding: 8, minWidth: 60, alignItems: 'center' },
  moreText: { fontSize: 12, color: colors.gray600, fontWeight: '500' },
  
  // Modal
  modal: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.gray900 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    gap: 8
  },
  modalSearch: { flex: 1, padding: 12, fontSize: 16, color: colors.gray900 },
  optionList: { flex: 1 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  optionActive: { backgroundColor: colors.blue50 },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '500', color: colors.gray900 },
  optionLabelActive: { color: colors.primary },
  optionSubtitle: { fontSize: 14, color: colors.gray500, marginTop: 2 },
  optionSubtitleActive: { color: colors.primary },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.gray500, fontStyle: 'italic' }
});