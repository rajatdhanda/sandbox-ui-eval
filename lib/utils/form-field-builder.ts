// lib/utils/form-field-builder.ts
// Path: lib/utils/form-field-builder.ts

import type { EntityOption } from '@/hooks/use-entity-options';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'checkbox' | 'switch' | 'select' | 'date' | 'smart-select';
  required?: boolean;
  placeholder?: string;
  options?: any[];
  displayField?: string;
}

export class FormFieldBuilder {
  static parentField(options: EntityOption[], required = true): FieldConfig {
    return {
      key: 'parent_id',
      label: 'Parent',
      type: 'smart-select',
      required,
      options,
      placeholder: 'Select parent'
    };
  }

  static childField(options: EntityOption[], required = true): FieldConfig {
    return {
      key: 'child_id',
      label: 'Child',
      type: 'smart-select',
      required,
      options,
      placeholder: 'Select child'
    };
  }

  static teacherField(options: EntityOption[], required = true): FieldConfig {
    return {
      key: 'teacher_id',
      label: 'Teacher',
      type: 'smart-select',
      required,
      options,
      placeholder: 'Select teacher'
    };
  }

  static classField(options: EntityOption[], required = true): FieldConfig {
    return {
      key: 'class_id',
      label: 'Class',
      type: 'smart-select',
      required,
      options,
      placeholder: 'Select class'
    };
  }

  static curriculumField(options: EntityOption[], required = true): FieldConfig {
    return {
      key: 'curriculum_id',
      label: 'Curriculum Template',
      type: 'smart-select',
      required,
      options,
      placeholder: 'Select curriculum'
    };
  }

  static relationshipTypeField(): FieldConfig {
    return {
      key: 'relationship_type',
      label: 'Relationship Type',
      type: 'select',
      required: true,
      options: ['parent', 'guardian', 'emergency'],
      placeholder: 'Select type'
    };
  }

  static roleField(): FieldConfig {
    return {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: ['primary', 'assistant', 'substitute'],
      placeholder: 'Select role'
    };
  }

  static dateField(key: string, label: string, required = false): FieldConfig {
    return {
      key,
      label,
      type: 'date',
      required,
      placeholder: 'YYYY-MM-DD'
    };
  }

  static textField(key: string, label: string, required = false, placeholder?: string): FieldConfig {
    return {
      key,
      label,
      type: 'text',
      required,
      placeholder: placeholder || `Enter ${label.toLowerCase()}`
    };
  }

  static textareaField(key: string, label: string, required = false, placeholder?: string): FieldConfig {
    return {
      key,
      label,
      type: 'textarea',
      required,
      placeholder: placeholder || `Enter ${label.toLowerCase()}`
    };
  }

  static checkboxField(key: string, label: string): FieldConfig {
    return {
      key,
      label,
      type: 'checkbox',
      required: false
    };
  }
}