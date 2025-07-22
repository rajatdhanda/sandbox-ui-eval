// app/components/shared/smart-selector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Search, X, Check, ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/styles';

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
  enableInlineSearch?: boolean;
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
  enableInlineSearch = true
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SmartSelectorOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  console.log('🎯 [SMART_SELECTOR] Rendering with options:', options.length);

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
    console.log('📝 [SMART_SELECTOR] Option selected:', option);
    onSelect(option.id, option);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleClearSelection = () => {
    console.log('🗑️ [SMART_SELECTOR] Clearing selection');
    onSelect('', undefined);
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleInputChange = (text: string) => {
    setSearchTerm(text);
    if (text.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      if (selectedOption) {
        setIsSearching(true);
      }
    }
  };

  const openModal = () => {
    if (!disabled) {
      setShowModal(true);
      setSearchTerm('');
    }
  };

  const displayValue = selectedOption ? selectedOption.label : '';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, required && styles.required]}>
        {label} {required && '*'}
      </Text>
      
      <View style={[
        styles.selectorContainer, 
        error && styles.selectorContainerError,
        disabled && styles.selectorContainerDisabled
      ]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.selectorInput, 
            !selectedOption && styles.placeholderText
          ]}
          value={isSearching ? searchTerm : displayValue}
          placeholder={placeholder}
          onChangeText={handleInputChange}
          editable={!disabled}
          placeholderTextColor={colors.gray500}
        />
        
        <TouchableOpacity 
          onPress={openModal} 
          style={styles.dropdownButton}
          disabled={disabled}
        >
          <ChevronDown size={16} color={disabled ? colors.gray400 : colors.gray600} />
        </TouchableOpacity>
      </View>

      {selectedOption?.subtitle && !isSearching && (
        <Text style={styles.selectedSubtitle}>{selectedOption.subtitle}</Text>
      )}

      {!isSearching && options.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.quickSelectContainer}
        >
          {options.slice(0, 5).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.quickSelectItem,
                value === option.id && styles.quickSelectItemSelected
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <Text style={[
                styles.quickSelectText,
                value === option.id && styles.quickSelectTextSelected
              ]}>
                {option.label}
              </Text>
              {option.subtitle && (
                <Text style={[
                  styles.quickSelectSubtext,
                  value === option.id && styles.quickSelectSubtextSelected
                ]}>
                  {option.subtitle}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {options.length > 5 && (
            <TouchableOpacity style={styles.moreButton} onPress={openModal}>
              <Text style={styles.moreButtonText}>+{options.length - 5} more</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {isSearching && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.quickSelectContainer}
        >
          {selectedOption && searchTerm === '' && (
            <TouchableOpacity
              style={[styles.quickSelectItem, styles.clearOption]}
              onPress={handleClearSelection}
            >
              <Text style={styles.clearOptionText}>Clear Selection</Text>
            </TouchableOpacity>
          )}
          
          {filteredOptions.slice(0, 5).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.quickSelectItem,
                value === option.id && styles.quickSelectItemSelected
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <Text style={[
                styles.quickSelectText,
                value === option.id && styles.quickSelectTextSelected
              ]}>
                {option.label}
              </Text>
              {option.subtitle && (
                <Text style={[
                  styles.quickSelectSubtext,
                  value === option.id && styles.quickSelectSubtextSelected
                ]}>
                  {option.subtitle}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {filteredOptions.length > 5 && (
            <TouchableOpacity style={styles.moreButton} onPress={openModal}>
              <Text style={styles.moreButtonText}>+{filteredOptions.length - 5} more</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <X size={24} color={colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.gray400} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={searchPlaceholder}
              autoFocus
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchTerm('')} 
                style={styles.clearButton}
              >
                <X size={16} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    value === option.id && styles.optionItemSelected
                  ]}
                  onPress={() => handleSelectOption(option)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      value === option.id && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    {option.subtitle && (
                      <Text style={[
                        styles.optionSubtitle,
                        value === option.id && styles.optionSubtitleSelected
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
              <View style={styles.emptyContainer}>
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

const styles = {
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray700,
    marginBottom: 6
  },
  required: {
    color: colors.gray900
  },
  selectorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    backgroundColor: colors.white
  },
  selectorContainerError: {
    borderColor: colors.error
  },
  selectorContainerDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200
  },
  selectorInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.gray900
  },
  placeholderText: {
    color: colors.gray500,
    fontStyle: 'italic' as const
  },
  dropdownButton: {
    padding: 12
  },
  selectedSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
    marginLeft: 12
  },
  quickSelectContainer: {
    marginTop: 8,
    paddingVertical: 4
  },
  quickSelectItem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    minWidth: 80
  },
  quickSelectItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.gray700,
    textAlign: 'center' as const
  },
  quickSelectTextSelected: {
    color: colors.primary
  },
  quickSelectSubtext: {
    fontSize: 10,
    color: colors.gray500,
    textAlign: 'center' as const,
    marginTop: 2
  },
  quickSelectSubtextSelected: {
    color: colors.primary
  },
  clearOption: {
    backgroundColor: colors.error,
    borderColor: colors.error
  },
  clearOptionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.white,
    textAlign: 'center' as const
  },
  moreButton: {
    backgroundColor: colors.gray100,
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minWidth: 60
  },
  moreButtonText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500' as const
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.gray900
  },
  closeButton: {
    padding: 8
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.gray900
  },
  clearButton: {
    padding: 4,
    marginLeft: 8
  },
  optionsList: {
    flex: 1
  },
  optionItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.gray900
  },
  optionLabelSelected: {
    color: colors.primary
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2
  },
  optionSubtitleSelected: {
    color: colors.primary
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center' as const
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray500,
    fontStyle: 'italic' as const
  }
};