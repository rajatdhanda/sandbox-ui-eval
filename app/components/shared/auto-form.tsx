// app/components/shared/auto-form.tsx
// Path: app/components/shared/auto-form.tsx

import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { colors } from '@/lib/styles';
import { SmartSelector } from './smart-selector';

interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'checkbox' | 'switch' | 'color' | 'select' | 'date' | 'custom' | 'smart-select';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[] | string[] | any[];
  displayField?: string; // For smart-select
  asyncOptions?: () => Promise<SelectOption[]>;
  render?: (value: any, onChange: (value: any) => void) => React.ReactNode;
}

interface AutoFormProps {
  fields: FieldConfig[];
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
}

export const AutoForm: React.FC<AutoFormProps> = ({
  fields,
  data,
  onChange,
  errors
}) => {
  const renderField = (field: FieldConfig) => {
    const value = data[field.key];
    const error = errors[field.key];

    // Custom render function
    if (field.type === 'custom' && field.render) {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          {field.render(value, (val) => onChange(field.key, val))}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    }

    switch (field.type) {
      case 'select':
        // Convert options to SmartSelector format
        const smartOptions = (field.options || []).map((opt: any) => {
          if (typeof opt === 'string') {
            return { id: opt, label: opt, searchText: opt };
          }
          return {
            id: opt.value,
            label: opt.label,
            subtitle: opt.subtitle,
            searchText: `${opt.label} ${opt.subtitle || ''}`.toLowerCase()
          };
        });

        return (
          <SmartSelector
            key={field.key}
            label={field.label + (field.required ? ' *' : '')}
            value={value || ''}
            onSelect={(val) => onChange(field.key, val)}
            options={smartOptions}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            required={field.required}
            error={error}
            searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
            emptyText={`No ${field.label.toLowerCase()} available`}
          />
        );

        case 'smart-select':
        return (
          <SmartSelector
            key={field.key}
            label={field.label + (field.required ? ' *' : '')}
            value={value || ''}
            onSelect={(val) => onChange(field.key, val)}
            options={field.options || []}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            required={field.required}
            error={error}
            searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
            emptyText={`No ${field.label.toLowerCase()} available`}
          />
        );

      case 'textarea':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}{field.required && ' *'}</Text>
            <TextInput
              style={[styles.textarea, error && styles.inputError]}
              value={value || ''}
              onChangeText={(text) => onChange(field.key, text)}
              placeholder={field.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'switch':
      case 'checkbox':
        return (
          <View key={field.key} style={styles.switchContainer}>
            <Text style={styles.label}>{field.label}{field.required && ' *'}</Text>
            <Switch
              value={!!value}
              onValueChange={(val) => onChange(field.key, val)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'number':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}{field.required && ' *'}</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(field.key, text ? parseInt(text) || 0 : '')}
              placeholder={field.placeholder}
              keyboardType="numeric"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case 'date':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}{field.required && ' *'}</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value || ''}
              onChangeText={(text) => onChange(field.key, text)}
              placeholder={field.placeholder || 'YYYY-MM-DD'}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      default:
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}{field.required && ' *'}</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value || ''}
              onChangeText={(text) => onChange(field.key, text)}
              placeholder={field.placeholder}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {fields.map(renderField)}
    </View>
  );
};

const styles = {
  container: {
    gap: 16,
    paddingBottom: 20, // Add padding to avoid button overlap
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
    minHeight: 100,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
};