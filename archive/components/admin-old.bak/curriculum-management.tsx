// app/components/admin/curriculum-management.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { BookOpen, Calendar, Users, Target, Plus, Filter, Upload } from 'lucide-react-native';

import { commonStyles, colors } from '@/lib/styles';
import { useCrud } from '@/hooks/use-crud';
import { db } from '@/lib/supabase/services/database.service';
import { 
  CrudHeader, 
  CrudStats, 
  CrudList, 
  CrudCard,
  ConsoleLogger 
} from '../shared/crud-components';
import { CurriculumForm } from '../shared/curriculum-form';

// Default form data for different entity types
const getDefaultFormData = (type: 'template' | 'item' | 'assignment') => {
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
  }
};

const validateCurriculumData = (data: any, type: 'template' | 'item' | 'assignment') => {
  console.log(`🔍 [CURRICULUM_MANAGEMENT] Validating ${type} data:`, data);
  const errors: Record<string, string> = {};

  switch (type) {
    case 'template':
      if (!data.name?.trim()) errors.name = 'Template name is required';
      if (!data.age_group?.trim()) errors.age_group = 'Age group is required';
      if (!data.subject_area?.trim()) errors.subject_area = 'Subject area is required';
      break;
    case 'item':
      if (!data.title?.trim()) errors.title = 'Activity title is required';
      if (!data.activity_type?.trim()) errors.activity_type = 'Activity type is required';
      if (!data.curriculum_id?.trim()) errors.curriculum_id = 'Template selection is required';
      if (data.week_number < 1) errors.week_number = 'Week must be 1 or higher';
      if (data.day_number < 1) errors.day_number = 'Day must be 1 or higher';
      break;
    case 'assignment':
      if (!data.curriculum_id?.trim()) errors.curriculum_id = 'Template is required';
      if (!data.class_id?.trim()) errors.class_id = 'Class is required';
      if (!data.start_date?.trim()) errors.start_date = 'Start date is required';
      break;
  }

  console.log(`📋 [CURRICULUM_MANAGEMENT] Validation errors for ${type}:`, errors);
  return errors;
};

export const CurriculumManagement = () => {
  const [activeView, setActiveView] = useState<'templates' | 'items' | 'assignments'>('templates');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [stats, setStats] = useState({ templates: 0, items: 0, assignments: 0 });
  const [showConsole, setShowConsole] = useState(false);

  console.log('🎯 [CURRICULUM_MANAGEMENT] Component initializing with view:', activeView);

  // Get table name based on active view
  const getTableName = () => {
    switch (activeView) {
      case 'templates': return 'curriculum_templates';
      case 'items': return 'curriculum_items';
      case 'assignments': return 'curriculum_assignments';
    }
  };

  // Get appropriate form data and validation
  const crud = useCrud({
    tableName: getTableName(),
    moduleName: 'CURRICULUM_MANAGEMENT',
    defaultFormData: getDefaultFormData(activeView === 'templates' ? 'template' : 
                                       activeView === 'items' ? 'item' : 'assignment'),
    validate: (data) => validateCurriculumData(data, 
      activeView === 'templates' ? 'template' : 
      activeView === 'items' ? 'item' : 'assignment'),
    selectQuery: getSelectQuery()
  });

  function getSelectQuery() {
    switch (activeView) {
      case 'templates':
        return '*';
      case 'items':
        return `
          *,
          curriculum_templates!curriculum_id(id, name, age_group)
        `;
      case 'assignments':
        return `
          *,
          curriculum_templates!curriculum_id(id, name, age_group),
          classes!class_id(id, name, age_group)
        `;
      default:
        return '*';
    }
  }

  // Fetch stats for all views
  const fetchStats = async () => {
    try {
      console.log('📊 [CURRICULUM_MANAGEMENT] Fetching stats...');
      
      const [templatesRes, itemsRes, assignmentsRes] = await Promise.all([
        db.read('curriculum_templates', { filters: { is_active: true } }),
        db.read('curriculum_items', { filters: { is_active: true } }),
        db.read('curriculum_assignments', { filters: { is_active: true } })
      ]);

      const newStats = {
        templates: templatesRes.data?.length || 0,
        items: itemsRes.data?.length || 0,
        assignments: assignmentsRes.data?.length || 0
      };

      console.log('📈 [CURRICULUM_MANAGEMENT] Stats updated:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ [CURRICULUM_MANAGEMENT] Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh data when view changes
  useEffect(() => {
    console.log('🔄 [CURRICULUM_MANAGEMENT] View changed to:', activeView);
    crud.fetchData();
  }, [activeView]);

  const handleAdd = () => {
    console.log('➕ [CURRICULUM_MANAGEMENT] Adding new:', activeView);
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    console.log('✏️ [CURRICULUM_MANAGEMENT] Editing:', item.id);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item: any) => {
    console.log('🗑️ [CURRICULUM_MANAGEMENT] Deleting:', item.id);
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${activeView.slice(0, -1)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => crud.handleDelete(item.id)
        }
      ]
    );
  };

  const renderItem = (item: any) => {
    let title = '', subtitle = '', metadata = '';

    switch (activeView) {
      case 'templates':
        title = item.name || 'Untitled Template';
        subtitle = `${item.age_group || 'No age group'} • ${item.subject_area || 'No subject'}`;
        metadata = `${item.total_weeks || 0} weeks • ${item.difficulty_level || 'No level'}`;
        break;
      case 'items':
        title = item.title || 'Untitled Activity';
        subtitle = item.description || item.activity_type || 'No description';
        metadata = `Week ${item.week_number || 1}, Day ${item.day_number || 1} • ${item.estimated_duration || 30}min`;
        break;
      case 'assignments':
        const templateName = item.curriculum_templates?.name || 'Unknown Template';
        const className = item.classes?.name || 'Unknown Class';
        title = `${templateName} → ${className}`;
        subtitle = `Started: ${item.start_date ? new Date(item.start_date).toLocaleDateString() : 'No date'}`;
        metadata = item.notes || 'No notes';
        break;
    }

    return (
      <CrudCard
        key={item.id}
        item={item}
        title={title}
        subtitle={subtitle}
        onEdit={() => handleEdit(item)}
        onDelete={() => handleDelete(item)}
        actionLoading={crud.actionLoading}
      >
        <Text style={styles.metadata}>{metadata}</Text>
      </CrudCard>
    );
  };

  const statsData = [
    { icon: <BookOpen size={24} color={colors.primary} />, value: stats.templates, label: 'Templates' },
    { icon: <Calendar size={24} color={colors.info} />, value: stats.items, label: 'Activities' },
    { icon: <Users size={24} color={colors.success} />, value: stats.assignments, label: 'Assignments' },
    { icon: <Target size={24} color={colors.warning} />, value: 0, label: 'Completed' }
  ];

  const tabs = [
    { key: 'templates', label: 'Templates', count: stats.templates },
    { key: 'items', label: 'Activities', count: stats.items },
    { key: 'assignments', label: 'Assignments', count: stats.assignments }
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <CrudHeader
        title="Curriculum Management"
        subtitle="Manage templates, activities and assignments"
        onAdd={handleAdd}
        onShowLogs={() => setShowConsole(!showConsole)}
        addButtonText={`Add ${activeView.slice(0, -1)}`}
      />
      
      <CrudStats stats={statsData} />
      
      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeView === tab.key && styles.activeTab]}
            onPress={() => setActiveView(tab.key as any)}
          >
            <Text style={[styles.tabText, activeView === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CrudList
        loading={crud.loading}
        items={crud.items || []}
        renderItem={renderItem}
        emptyIcon={<BookOpen size={48} color={colors.gray300} />}
        emptyTitle={`No ${activeView} found`}
        emptySubtitle="Try adding a new item or check your filters"
        onRefresh={crud.fetchData}
      />

      {/* Console Logger */}
      {showConsole && (
        <ConsoleLogger visible={showConsole} onClose={() => setShowConsole(false)} />
      )}

      {/* Form Modal */}
      <CurriculumForm
        type={activeView === 'templates' ? 'template' : 
              activeView === 'items' ? 'item' : 'assignment'}
        item={editingItem}
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={() => {
          crud.fetchData();
          fetchStats();
          setShowForm(false);
          setEditingItem(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = {
  tabContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: 16
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500'
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600'
  },
  metadata: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4
  }
};