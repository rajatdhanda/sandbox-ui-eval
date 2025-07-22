// lib/types/relationships.ts - Future-proof relationship system
export interface BaseRelationship {
  id: string;
  created_at: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface RelationshipConfig {
  type: string;
  parentEntity: {
    table: string;
    displayField: string;
    filters?: Record<string, any>;
  };
  childEntity: {
    table: string;
    displayField: string;
    filters?: Record<string, any>;
  };
  relationshipTable: string;
  additionalFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'date';
    required?: boolean;
    options?: string[];
  }>;
}

// Current relationship configurations
export const RELATIONSHIP_CONFIGS: Record<string, RelationshipConfig> = {
  parent_child: {
    type: 'parent_child',
    parentEntity: {
      table: 'users',
      displayField: 'full_name',
      filters: { role: 'parent', is_active: true }
    },
    childEntity: {
      table: 'children', 
      displayField: 'first_name,last_name',
      filters: { is_active: true }
    },
    relationshipTable: 'parent_child_relationships',
    additionalFields: [
      { key: 'relationship_type', label: 'Relationship Type', type: 'select', options: ['parent', 'guardian', 'emergency_contact'] },
      { key: 'is_primary', label: 'Primary Contact', type: 'boolean' }
    ]
  },
  teacher_class: {
    type: 'teacher_class',
    parentEntity: {
      table: 'users',
      displayField: 'full_name',
      filters: { role: 'teacher', is_active: true }
    },
    childEntity: {
      table: 'classes',
      displayField: 'name',
      filters: { is_active: true }
    },
    relationshipTable: 'class_assignments',
    additionalFields: [
      { key: 'is_primary', label: 'Primary Teacher', type: 'boolean' },
      { key: 'assigned_date', label: 'Assignment Date', type: 'date' }
    ]
  },
  curriculum_class: {
    type: 'curriculum_class',
    parentEntity: {
      table: 'curriculum_templates',
      displayField: 'name',
      filters: { is_active: true }
    },
    childEntity: {
      table: 'classes',
      displayField: 'name', 
      filters: { is_active: true }
    },
    relationshipTable: 'curriculum_assignments',
    additionalFields: [
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'text' }
    ]
  }
  // Future relationships can be easily added:
  // curriculum_student: { ... },
  // curriculum_timeslot: { ... },
  // student_worksheet: { ... }
};