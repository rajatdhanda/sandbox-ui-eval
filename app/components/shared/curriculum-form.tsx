// app/components/shared/curriculum-form.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { X, Save, Loader2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/styles';
import { db } from '@/lib/supabase/services/database.service';
import { SmartSelector } from './smart-selector';
import { AttachmentField } from './attachment-field';

interface CurriculumFormProps {
  type: 'template' | 'item' | 'assignment';
  item?: any;
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CurriculumForm: React.FC<CurriculumFormProps> = ({
  type,
  item,
  visible,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dropdownOptions, setDropdownOptions] = useState<any>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [ageGroupOptions, setAgeGroupOptions] = useState<any[]>([]);
  const [subjectAreaOptions, setSubjectAreaOptions] = useState<any[]>([]);
  const [activityTypeOptions, setActivityTypeOptions] = useState<any[]>([]);

  console.log(`🎯 [CURRICULUM_FORM] Initializing ${type} form with item:`, item?.id);

  // Initialize form data based on type and item
  useEffect(() => {
    const getDefaultData = () => {
      const base = {
        is_active: true,
        created_at: new Date().toISOString(),
      };

      switch (type) {
        case 'template':
          return {
            ...base,
            name: '',
            description: '',
            age_group: '',
            subject_area: '',
            difficulty_level: 'beginner',
            total_weeks: 4,
            learning_objectives: [],
            materials_list: [],
            is_template: true
          };
        case 'item':
          return {
            ...base,
            title: '',
            description: '',
            activity_type: '',
            week_number: 1,
            day_number: 1,
            estimated_duration: 30,
            materials_needed: [],
            instructions: '',
            learning_goals: [],
            curriculum_id: ''
          };
        case 'assignment':
          return {
            ...base,
            curriculum_id: '',
            class_id: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            notes: ''
          };
        default:
          return base;
      }
    };

    const defaultData = getDefaultData();
    setFormData(item ? { ...defaultData, ...item } : defaultData);
    setErrors({});
  }, [type, item]);

  // Load reference data
  useEffect(() => {
    if (visible) {
      loadReferenceData();
    }
  }, [visible]);

  const loadReferenceData = async () => {
    try {
      console.log('📦 [CURRICULUM_FORM] Loading reference data...');
      
      // Load predefined options
      setAgeGroupOptions([
        { id: '0-18m', label: '0-18 months', subtitle: 'Infants', searchText: '0 18 months infant baby' },
        { id: '18m-2y', label: '18m-2 years', subtitle: 'Toddlers', searchText: '18 months 2 years toddler' },
        { id: '2-3y', label: '2-3 years', subtitle: 'Toddlers', searchText: '2 3 years toddler' },
        { id: '3-4y', label: '3-4 years', subtitle: 'Preschool', searchText: '3 4 years preschool' },
        { id: '4-5y', label: '4-5 years', subtitle: 'Pre-K', searchText: '4 5 years pre k kindergarten' },
        { id: '5-6y', label: '5-6 years', subtitle: 'Kindergarten', searchText: '5 6 years kindergarten' }
      ]);

      setSubjectAreaOptions([
        { id: 'mathematics', label: 'Mathematics', subtitle: 'Numbers, counting, patterns', searchText: 'math numbers counting' },
        { id: 'language', label: 'Language Arts', subtitle: 'Reading, writing, communication', searchText: 'language reading writing letters' },
        { id: 'science', label: 'Science & Discovery', subtitle: 'Exploration, experiments', searchText: 'science discovery experiments nature' },
        { id: 'social', label: 'Social Studies', subtitle: 'Community, cultures, history', searchText: 'social community culture history' },
        { id: 'creative', label: 'Creative Arts', subtitle: 'Art, music, drama', searchText: 'art music creative drama painting' },
        { id: 'physical', label: 'Physical Development', subtitle: 'Motor skills, movement', searchText: 'physical motor movement exercise' },
        { id: 'emotional', label: 'Social-Emotional', subtitle: 'Feelings, relationships', searchText: 'emotional social feelings relationships' }
      ]);

      setActivityTypeOptions([
        { id: 'learning', label: 'Learning Activity', subtitle: 'Structured learning experience', searchText: 'learning activity lesson' },
        { id: 'assessment', label: 'Assessment', subtitle: 'Evaluation and testing', searchText: 'assessment test evaluation check' },
        { id: 'play', label: 'Play-based Learning', subtitle: 'Learning through play', searchText: 'play games fun interactive' },
        { id: 'outdoor', label: 'Outdoor Activity', subtitle: 'Outside exploration', searchText: 'outdoor outside nature playground' },
        { id: 'group', label: 'Group Activity', subtitle: 'Collaborative learning', searchText: 'group team together collaborative' },
        { id: 'independent', label: 'Independent Work', subtitle: 'Self-directed activity', searchText: 'independent solo self directed' },
        { id: 'story', label: 'Story Time', subtitle: 'Reading and storytelling', searchText: 'story reading books storytelling' },
        { id: 'craft', label: 'Arts & Crafts', subtitle: 'Creative making', searchText: 'craft art creative making building' }
      ]);

      // Load dropdown options from database if they exist
      try {
        const optionsRes = await db.read('curriculum_options', {
          filters: { is_active: true },
          orderBy: [{ column: 'category' }, { column: 'sort_order' }]
        });

        if (optionsRes.data && optionsRes.data.length > 0) {
          const grouped = optionsRes.data.reduce((acc: any, option: any) => {
            if (!acc[option.category]) acc[option.category] = [];
            acc[option.category].push({
              id: option.value,
              label: option.label,
              subtitle: option.description,
              searchText: option.label.toLowerCase()
            });
            return acc;
          }, {});
          
          // Override with database options if available
          if (grouped.age_group) setAgeGroupOptions(grouped.age_group);
          if (grouped.subject_area) setSubjectAreaOptions(grouped.subject_area);
          if (grouped.activity_type) setActivityTypeOptions(grouped.activity_type);
        }
      } catch (optionsError) {
        console.log('📝 [CURRICULUM_FORM] No database options found, using defaults');
      }

      // Load templates for item and assignment forms
      if (type === 'item' || type === 'assignment') {
        const templatesRes = await db.read('curriculum_templates', {
          filters: { is_active: true },
          orderBy: [{ column: 'name' }]
        });
        
        const templateOptions = (templatesRes.data || []).map((template: any) => ({
          id: template.id,
          label: template.name,
          subtitle: `${template.age_group} • ${template.subject_area} • ${template.total_weeks || 4} weeks`,
          searchText: `${template.name} ${template.age_group} ${template.subject_area}`.toLowerCase(),
          metadata: template
        }));
        
        setTemplates(templateOptions);
      }

      // Load classes for assignment forms
      if (type === 'assignment') {
        const classesRes = await db.read('classes', {
          filters: { is_active: true },
          orderBy: [{ column: 'name' }]
        });
        
        const classOptions = (classesRes.data || []).map((cls: any) => ({
          id: cls.id,
          label: cls.name,
          subtitle: `${cls.age_group} • ${cls.capacity || 20} students • ${cls.schedule_start || ''}-${cls.schedule_end || ''}`,
          searchText: `${cls.name} ${cls.age_group}`.toLowerCase(),
          metadata: cls
        }));
        
        setClasses(classOptions);
      }

    } catch (error) {
      console.error('❌ [CURRICULUM_FORM] Error loading reference data:', error);
    }
  };

  const updateField = (key: string, value: any) => {
    console.log(`📝 [CURRICULUM_FORM] Updating field ${key}:`, value);
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    
    // Clear error for this field if it exists
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    console.log('🔍 [CURRICULUM_FORM] Validating form data:', formData);
    const newErrors: Record<string, string> = {};

    switch (type) {
      case 'template':
        if (!formData.name?.trim()) newErrors.name = 'Template name is required';
        if (!formData.age_group?.trim()) newErrors.age_group = 'Age group is required';
        if (!formData.subject_area?.trim()) newErrors.subject_area = 'Subject area is required';
        break;
      case 'item':
        if (!formData.title?.trim()) newErrors.title = 'Activity title is required';
        if (!formData.activity_type?.trim()) newErrors.activity_type = 'Activity type is required';
        if (!formData.curriculum_id?.trim()) newErrors.curriculum_id = 'Template selection is required';
        if (!formData.week_number || formData.week_number < 1) newErrors.week_number = 'Week must be 1 or higher';
        if (!formData.day_number || formData.day_number < 1) newErrors.day_number = 'Day must be 1 or higher';
        break;
      case 'assignment':
        if (!formData.curriculum_id?.trim()) newErrors.curriculum_id = 'Template is required';
        if (!formData.class_id?.trim()) newErrors.class_id = 'Class is required';
        if (!formData.start_date?.trim()) newErrors.start_date = 'Start date is required';
        
        // Validate date format
        if (formData.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.start_date)) {
          newErrors.start_date = 'Start date must be in YYYY-MM-DD format';
        }
        if (formData.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.end_date)) {
          newErrors.end_date = 'End date must be in YYYY-MM-DD format';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      console.log('❌ [CURRICULUM_FORM] Validation failed:', errors);
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setLoading(true);
    try {
      console.log(`💾 [CURRICULUM_FORM] Saving ${type}:`, formData);

      // Clean the data - remove undefined/empty values except for arrays and booleans
      const cleanData = Object.entries(formData).reduce((acc: any, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        } else if (Array.isArray(value)) {
          acc[key] = value; // Keep empty arrays
        } else if (typeof value === 'boolean') {
          acc[key] = value; // Keep boolean values
        }
        return acc;
      }, {});

      // Special handling for assignments
      if (type === 'assignment') {
        console.log(`🎯 [CURRICULUM_FORM] Processing assignment with data:`, cleanData);
        
        // Ensure required fields are present and not empty
        if (!cleanData.curriculum_id) {
          console.error('❌ [CURRICULUM_FORM] Missing curriculum_id');
          Alert.alert('Error', 'Please select a template');
          return;
        }
        if (!cleanData.class_id) {
          console.error('❌ [CURRICULUM_FORM] Missing class_id');
          Alert.alert('Error', 'Please select a class');
          return;
        }
        if (!cleanData.start_date) {
          console.error('❌ [CURRICULUM_FORM] Missing start_date');
          Alert.alert('Error', 'Please enter a start date');
          return;
        }
        
        // Remove any null/undefined values that might cause issues
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key] === null || cleanData[key] === undefined) {
            delete cleanData[key];
          }
        });
        
        // Add default values for assignment-specific fields
        if (!item?.id) {
          cleanData.created_at = new Date().toISOString();
          cleanData.is_active = true;
        } else {
          cleanData.updated_at = new Date().toISOString();
        }
        
        console.log(`✅ [CURRICULUM_FORM] Final assignment data:`, cleanData);
      }

      // Add timestamps for other types
      if (!item?.id) {
        cleanData.created_at = new Date().toISOString();
        cleanData.is_active = true;
      } else {
        cleanData.updated_at = new Date().toISOString();
      }

      // Determine table name
      const tableName = type === 'template' ? 'curriculum_templates' : 
                      type === 'item' ? 'curriculum_items' : 'curriculum_assignments';

      let result;
      if (item?.id) {
        // Update existing item
        result = await db.update(tableName, cleanData, { id: item.id });
      } else {
        // Create new item
        result = await db.create(tableName, cleanData);
      }

      if (result?.error) {
        console.error('❌ [CURRICULUM_FORM] Save failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to save data');
      } else {
        console.log('✅ [CURRICULUM_FORM] Save successful:', result);
        Alert.alert('Success', `${type} ${item?.id ? 'updated' : 'created'} successfully`);
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('❌ [CURRICULUM_FORM] Save error:', error);
      Alert.alert('Error', 'Failed to save data');
    }
    setLoading(false);
  };

  const renderTemplateForm = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Template Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name || ''}
          onChangeText={(text) => updateField('name', text)}
          placeholder="e.g., Early Math Concepts"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <SmartSelector
        label="Age Group"
        value={formData.age_group || ''}
        onSelect={(value) => updateField('age_group', value)}
        options={ageGroupOptions}
        placeholder="Select age group"
        required
        error={errors.age_group}
        searchPlaceholder="Search age groups..."
      />

      <SmartSelector
        label="Subject Area"
        value={formData.subject_area || ''}
        onSelect={(value) => updateField('subject_area', value)}
        options={subjectAreaOptions}
        placeholder="Select subject area"
        required
        error={errors.subject_area}
        searchPlaceholder="Search subjects..."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description || ''}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Brief description of the template"
          multiline
          numberOfLines={3}
        />
      </View>

      <AttachmentField
        label="Assignment Resources"
        attachments={formData.attachments || []}
        onUpdate={(attachments) => updateField('attachments', attachments)}
        placeholder="Add assignment documents"
        maxAttachments={3}
        allowedTypes={['pdf', 'link', 'document']}
      />

      <AttachmentField
        label="Attachments"
        attachments={formData.attachments || []}
        onUpdate={(attachments) => updateField('attachments', attachments)}
        placeholder="Add supporting materials"
        maxAttachments={5}
        allowedTypes={['pdf', 'video', 'photo', 'link', 'document']}
      />

      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Total Weeks</Text>
          <TextInput
            style={styles.input}
            value={formData.total_weeks?.toString() || '4'}
            onChangeText={(text) => updateField('total_weeks', parseInt(text) || 4)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Difficulty Level</Text>
          <TextInput
            style={styles.input}
            value={formData.difficulty_level || 'beginner'}
            onChangeText={(text) => updateField('difficulty_level', text)}
            placeholder="beginner, intermediate, advanced"
          />
        </View>
      </View>
    </>
  );

  const renderItemForm = () => (
    <>
      <SmartSelector
        label="Template"
        value={formData.curriculum_id || ''}
        onSelect={(value) => updateField('curriculum_id', value)}
        options={templates}
        placeholder="Select curriculum template"
        required
        error={errors.curriculum_id}
        searchPlaceholder="Search templates..."
        emptyText="No templates available. Create a template first."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Activity Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title || ''}
          onChangeText={(text) => updateField('title', text)}
          placeholder="e.g., Counting with Bears"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <SmartSelector
        label="Activity Type"
        value={formData.activity_type || ''}
        onSelect={(value) => updateField('activity_type', value)}
        options={activityTypeOptions}
        placeholder="Select activity type"
        required
        error={errors.activity_type}
        searchPlaceholder="Search activity types..."
      />

      <View style={styles.rowFields}>
        <View style={styles.thirdField}>
          <Text style={styles.label}>Week *</Text>
          <TextInput
            style={[styles.input, errors.week_number && styles.inputError]}
            value={formData.week_number?.toString() || '1'}
            onChangeText={(text) => updateField('week_number', parseInt(text) || 1)}
            keyboardType="numeric"
          />
          {errors.week_number && <Text style={styles.errorText}>{errors.week_number}</Text>}
        </View>
        <View style={styles.thirdField}>
          <Text style={styles.label}>Day *</Text>
          <TextInput
            style={[styles.input, errors.day_number && styles.inputError]}
            value={formData.day_number?.toString() || '1'}
            onChangeText={(text) => updateField('day_number', parseInt(text) || 1)}
            keyboardType="numeric"
          />
          {errors.day_number && <Text style={styles.errorText}>{errors.day_number}</Text>}
        </View>
        <View style={styles.thirdField}>
          <Text style={styles.label}>Duration (min)</Text>
          <TextInput
            style={styles.input}
            value={formData.estimated_duration?.toString() || '30'}
            onChangeText={(text) => updateField('estimated_duration', parseInt(text) || 30)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.instructions || ''}
          onChangeText={(text) => updateField('instructions', text)}
          placeholder="Step-by-step instructions for the activity"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description || ''}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Brief description of the activity"
          multiline
          numberOfLines={2}
        />
      </View>

      <AttachmentField
        label="Resources & Materials"
        attachments={formData.attachments || []}
        onUpdate={(attachments) => updateField('attachments', attachments)}
        placeholder="Add activity resources"
        maxAttachments={8}
        allowedTypes={['pdf', 'video', 'photo', 'link']}
      />
    </>
  );

  const renderAssignmentForm = () => (
    <>
      <SmartSelector
        label="Template"
        value={formData.curriculum_id || ''}
        onSelect={(value) => updateField('curriculum_id', value)}
        options={templates}
        placeholder="Select curriculum template"
        required
        error={errors.curriculum_id}
        searchPlaceholder="Search templates..."
        emptyText="No templates available. Create a template first."
      />

      <SmartSelector
        label="Class"
        value={formData.class_id || ''}
        onSelect={(value) => updateField('class_id', value)}
        options={classes}
        placeholder="Select class"
        required
        error={errors.class_id}
        searchPlaceholder="Search classes..."
        emptyText="No classes available. Create a class first."
      />

      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={[styles.input, errors.start_date && styles.inputError]}
            value={formData.start_date || ''}
            onChangeText={(text) => updateField('start_date', text)}
            placeholder="YYYY-MM-DD"
          />
          {errors.start_date && <Text style={styles.errorText}>{errors.start_date}</Text>}
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>End Date</Text>
          <TextInput
            style={styles.input}
            value={formData.end_date || ''}
            onChangeText={(text) => updateField('end_date', text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes || ''}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Additional notes about this assignment"
          multiline
          numberOfLines={3}
        />
      </View>
    </>
  );

  const getFormContent = () => {
    switch (type) {
      case 'template': return renderTemplateForm();
      case 'item': return renderItemForm();
      case 'assignment': return renderAssignmentForm();
      default: return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {item?.id ? 'Edit' : 'Add'} {type === 'template' ? 'Template' : 
                                        type === 'item' ? 'Activity' : 'Assignment'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {getFormContent()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} color={colors.white} />
            ) : (
              <Save size={20} color={colors.white} />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.gray900
  },
  closeButton: {
    padding: 8
  },
  form: {
    flex: 1,
    padding: 16
  },
  field: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray700,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white
  },
  inputError: {
    borderColor: colors.error
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  },
  rowFields: {
    flexDirection: 'row' as const,
    gap: 12
  },
  halfField: {
    flex: 1
  },
  thirdField: {
    flex: 1
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 8,
    minHeight: 50,
    backgroundColor: colors.gray50
  },
  pickerItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 150,
    borderWidth: 1,
    borderColor: colors.gray200
  },
  pickerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray700
  },
  pickerTextSelected: {
    color: colors.primary
  },
  pickerSubtext: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2
  },
  noOptionsText: {
    fontSize: 14,
    color: colors.gray500,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    padding: 16
  },
  footer: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center' as const
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.gray700
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray400
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.white
  }
};