// app/components/shared/crud-components.tsx
// Path: app/components/shared/crud-components.tsx

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  X, 
  Activity 
} from 'lucide-react-native';
import { commonStyles, colors, spacing, borderRadius, typography } from '@/lib/styles';

// Header Component
interface CrudHeaderProps {
  title: string;
  subtitle: string;
  onAdd: () => void;
  onShowLogs: () => void;
  addButtonText?: string;
  style?: any; // For animated styles
  compact?: boolean; // For compact mode when scrolling
}

export const CrudHeader: React.FC<CrudHeaderProps> = ({
  title,
  subtitle,
  onAdd,
  onShowLogs,
  addButtonText = 'Add Item',
  style,
  compact = false
}) => (
  <View style={[commonStyles.header, style]}>
    <View style={{ flex: 1 }}>
      {!compact && <Text style={commonStyles.headerTitle as any}>{title}</Text>}
      <Text style={[commonStyles.headerSubtitle, compact && { fontSize: typography.base, fontWeight: typography.medium }]}>
        {compact ? title : subtitle}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={onShowLogs}
      >
        <Activity size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[commonStyles.buttonPrimary, compact && styles.compactButton]}
        onPress={onAdd}
      >
        <Plus size={compact ? 18 : 20} color={colors.white} />
        {!compact && <Text style={[commonStyles.buttonText, { marginLeft: spacing.sm }]}>{addButtonText}</Text>}
      </TouchableOpacity>
    </View>
  </View>
);

// Stats Component
interface StatItem {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}

interface CrudStatsProps {
  stats: StatItem[];
}

export const CrudStats: React.FC<CrudStatsProps> = ({ stats }) => (
  <View style={commonStyles.statsContainer as any}>
    {stats.map((stat, index) => (
      <View key={index} style={commonStyles.statCard as any}>
        {stat.icon}
        <Text style={commonStyles.statNumber as any}>{stat.value}</Text>
        <Text style={commonStyles.statLabel as any}>{stat.label}</Text>
      </View>
    ))}
  </View>
);

// Filters Component
interface CrudFiltersProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  filterButtons?: { key: string; label: string; isActive: boolean }[];
  onFilterChange?: (key: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CrudFilters: React.FC<CrudFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterButtons = [],
  onFilterChange,
  onRefresh,
  loading
}) => (
  <View style={commonStyles.filtersContainer as any}>
    <View style={commonStyles.searchContainer as any}>
      <Search size={20} color={colors.textSecondary} />
      <TextInput
        style={commonStyles.searchInput as any}
        placeholder="Search..."
        value={searchTerm}
        onChangeText={onSearchChange}
      />
    </View>
    
    {filterButtons.length > 0 && (
      <View style={commonStyles.filterRow as any}>
        {filterButtons.map((button) => (
          <TouchableOpacity 
            key={button.key}
            style={[
              commonStyles.filterButton, 
              button.isActive && commonStyles.filterButtonActive
            ]}
            onPress={() => onFilterChange?.(button.key)}
          >
            <Text style={[
              commonStyles.filterButtonText, 
              button.isActive && commonStyles.filterButtonTextActive
            ]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

    <TouchableOpacity
      style={styles.refreshButton}
      onPress={onRefresh}
      disabled={loading}
    >
      <RefreshCw size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

// List Component
interface CrudListProps {
  loading: boolean;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
}

export const CrudList: React.FC<CrudListProps> = ({
  loading,
  items,
  renderItem,
  emptyTitle = 'No items found',
  emptySubtitle = 'Try adjusting your search criteria or add a new item.',
  emptyIcon
}) => (
  <ScrollView style={commonStyles.scrollContainer as any} showsVerticalScrollIndicator={false}>
    {loading ? (
      <View style={commonStyles.loadingContainer as any}>
        <RefreshCw size={24} color={colors.primary} />
        <Text style={commonStyles.loadingText as any}>Loading...</Text>
      </View>
    ) : items.length === 0 ? (
      <View style={commonStyles.emptyContainer as any}>
        {emptyIcon}
        <Text style={commonStyles.emptyTitle as any}>{emptyTitle}</Text>
        <Text style={commonStyles.emptySubtitle as any}>{emptySubtitle}</Text>
      </View>
    ) : (
      items.map(renderItem)
    )}
  </ScrollView>
);

// Card Component
interface CrudCardProps {
  item: any;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  actionLoading: string | null;
  colorBar?: string;
  extraActions?: React.ReactNode;
  titleIcon?: React.ReactNode;  // ADD THIS
  hideDefaultActions?: boolean;   // ADD THIS
  onPress?: () => void;          // ADD THIS
}

export const CrudCard: React.FC<CrudCardProps> = ({
  item,
  title,
  subtitle,
  children,
  onEdit,
  onDelete,
  actionLoading,
  colorBar,
  extraActions,
  titleIcon,
  hideDefaultActions,
  onPress
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};
  
  return (
    <CardWrapper style={commonStyles.card as any} {...cardProps}>
      {colorBar && <View style={[styles.colorBar, { backgroundColor: colorBar }]} />}
      
      <View style={commonStyles.cardHeader as any}>
        <View style={commonStyles.flex1 as any}>
          <View style={styles.titleRow}>
            {titleIcon && <View style={styles.titleIcon}>{titleIcon}</View>}
            <View style={commonStyles.flex1 as any}>
              <Text style={commonStyles.cardTitle as any}>{title}</Text>
              {subtitle && <Text style={commonStyles.cardSubtitle as any}>{subtitle}</Text>}
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          {extraActions}
          {!hideDefaultActions && (
            <>
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Edit2 size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDelete}
                disabled={actionLoading === `delete-${item.id}`}
                style={styles.actionButton}
              >
                {actionLoading === `delete-${item.id}` ? (
                  <RefreshCw size={16} color={colors.textSecondary} />
                ) : (
                  <Trash2 size={16} color={colors.error} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {children && <View style={styles.cardContent}>{children}</View>}
    </CardWrapper>
  );
};

// UPDATED Form Modal Component with proper styling
interface CrudFormProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitText: string;
  children: React.ReactNode;
}

export const CrudForm: React.FC<CrudFormProps> = ({
  visible,
  title,
  onClose,
  onSubmit,
  loading,
  submitText = 'Save',
  children
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <SafeAreaView style={styles.modalContainer} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={styles.modalContent} 
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading && <RefreshCw size={16} color={colors.white} />}
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : submitText}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>
);

// Form Field Component
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children
}) => (
  <View style={commonStyles.formGroup as any}>
    <Text style={commonStyles.formLabel as any}>
      {label} {required && '*'}
    </Text>
    {children}
    {error && <Text style={commonStyles.errorText as any}>{error}</Text>}
  </View>
);

// Input Component
interface FormInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  numberOfLines?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  value,
  onChangeText,
  placeholder,
  error = false,
  multiline = false,
  keyboardType = 'default',
  numberOfLines
}) => (
  <TextInput
    style={[
      commonStyles.formInput,
      multiline && commonStyles.formTextArea,
      error && commonStyles.formInputError
    ]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    textAlignVertical={multiline ? 'top' : 'center'}
  />
);

// Checkbox Component
interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onValueChange,
  label
}) => (
  <TouchableOpacity
    style={styles.checkboxContainer}
    onPress={() => onValueChange(!value)}
  >
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <Text style={styles.checkboxMark}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

// Color Picker Component
interface ColorPickerProps {
  value: string;
  onValueChange: (color: string) => void;
  colors: string[];
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onValueChange,
  colors: colorOptions
}) => (
  <View style={styles.colorGrid}>
    {colorOptions.map((color) => (
      <TouchableOpacity
        key={color}
        style={[
          styles.colorOption,
          { backgroundColor: color },
          value === color && styles.colorOptionSelected
        ]}
        onPress={() => onValueChange(color)}
      />
    ))}
  </View>
);

// Status Badge Component
interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeText = 'Active',
  inactiveText = 'Inactive'
}) => (
  <View style={[
    styles.statusBadge,
    { backgroundColor: isActive ? colors.success : colors.error }
  ]}>
    <Text style={styles.statusText}>
      {isActive ? activeText : inactiveText}
    </Text>
  </View>
);

// Detail Row Component
interface DetailRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const DetailRow: React.FC<DetailRowProps> = ({ icon, children }) => (
  <View style={styles.detailRow}>
    {icon}
    <View style={{ marginLeft: spacing.sm }}>{children}</View>
  </View>
);


// Add these missing exports at the END of the file:

// Add these for compatibility with Component Bible
export const CrudTable = CrudList;  // Alias
export const CrudModal = CrudForm;   // Alias
export const CrudDetail = ({ item, children }: any) => (
  <View style={commonStyles.card as any}>{children}</View>
);
export const CrudPagination = ({ currentPage, totalPages, onPageChange }: any) => (
  <View style={styles.paginationContainer}>
    <Text>Page {currentPage} of {totalPages}</Text>
  </View>
);

// Add pagination container style to styles object

// Styles for this file only
const styles = {
  debugButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  refreshButton: {
    alignSelf: 'flex-end' as const,
    padding: spacing.sm,
  },
  colorBar: {
    height: 4,
  },
  cardActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
  },
  cardContent: {
    paddingBottom: spacing.md,
  },
titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: spacing.sm,
  },
  titleIcon: {
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  checkboxLabel: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.white,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  // Modal styles for CrudForm
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  modalContentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing['2xl'], // Extra padding at bottom
  },
  modalFooter: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
};