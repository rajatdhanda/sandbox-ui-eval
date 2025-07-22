// components/shared/curriculum-manager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BookOpen, Plus, Calendar, Users, Target, Upload, Download, Filter } from 'lucide-react-native';
import { db } from '@/lib/supabase/services/database.service';
import { colors } from '@/lib/styles';
import { CrudHeader, CrudStats, CrudList, CrudCard } from '../crud-components';

interface CurriculumManagerProps {
  mode?: 'admin' | 'teacher' | 'parent';
  classId?: string;
}

export const CurriculumManager = ({ mode = 'admin', classId }: CurriculumManagerProps) => {
  const [activeView, setActiveView] = useState<'templates' | 'items' | 'assignments' | 'executions'>('templates');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ templates: 0, items: 0, assignments: 0, executions: 0 });
  const [filters, setFilters] = useState({ 
    ageGroup: '', 
    subjectArea: '', 
    difficultyLevel: '',
    week: '',
    completionStatus: ''
  });

  useEffect(() => { fetchData(); }, [activeView, classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let tableName = '';
      let selectQuery = '*';
      let filterConditions: any = { is_active: true };

      switch (activeView) {
        case 'templates':
          tableName = 'curriculum_templates';
          break;
        case 'items':
          tableName = 'curriculum_items';
          selectQuery = '*, curriculum_templates(name), time_slots(name, start_time)';
          break;
        case 'assignments':
          tableName = 'curriculum_assignments';
          selectQuery = '*, curriculum_templates(name), classes(name)';
          if (classId) filterConditions.class_id = classId;
          break;
        case 'executions':
          tableName = 'curriculum_executions';
          selectQuery = '*, curriculum_items(title), classes(name), users(first_name, last_name)';
          if (classId) filterConditions.class_id = classId;
          break;
      }

      const { data } = await db.read(tableName, {
        select: selectQuery,
        filters: filterConditions,
        orderBy: [{ column: 'created_at', ascending: false }]
      });

      setItems(data || []);
      await fetchStats();
    } catch (error) {
      console.error(`Error fetching ${activeView}:`, error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [templatesRes, itemsRes, assignmentsRes, executionsRes] = await Promise.all([
        db.count('curriculum_templates', { is_active: true }),
        db.count('curriculum_items', { is_active: true }),
        db.count('curriculum_assignments', { is_active: true }),
        db.count('curriculum_executions', {})
      ]);

      setStats({
        templates: templatesRes.count || 0,
        items: itemsRes.count || 0,
        assignments: assignmentsRes.count || 0,
        executions: executionsRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatsConfig = () => [
    { icon: <BookOpen size={24} color={colors.primary} />, value: stats.templates, label: 'Templates' },
    { icon: <Calendar size={24} color={colors.info} />, value: stats.items, label: 'Activities' },
    { icon: <Users size={24} color={colors.success} />, value: stats.assignments, label: 'Assignments' },
    { icon: <Target size={24} color={colors.warning} />, value: stats.executions, label: 'Completed' }
  ];

  const getViewTabs = () => {
    const allTabs = [
      { key: 'templates', label: 'Templates', count: stats.templates },
      { key: 'items', label: 'Activities', count: stats.items },
      { key: 'assignments', label: 'Assignments', count: stats.assignments },
      { key: 'executions', label: 'Progress', count: stats.executions }
    ];
    
    return mode === 'teacher' 
      ? allTabs.filter(tab => ['items', 'assignments', 'executions'].includes(tab.key))
      : allTabs;
  };

  const getExtraActions = () => {
    const actions = [
      { icon: <Upload size={16} color={colors.white} />, label: 'Import', onPress: () => handleBulkImport() }
    ];
    
    if (mode === 'admin') {
      actions.push(
        { icon: <Download size={16} color={colors.white} />, label: 'Export', onPress: () => handleExport() },
        { icon: <Filter size={16} color={colors.white} />, label: 'Filters', onPress: () => handleFilters() }
      );
    }
    
    return actions;
  };

  const handleBulkImport = () => {
    Alert.alert('Bulk Import', 'Import curriculum from CSV, JSON, or external sources');
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export curriculum data to PDF or CSV');
  };

  const handleFilters = () => {
    Alert.alert('Filters', 'Advanced filtering options');
  };

  const handleAdd = () => {
    Alert.alert('Add New', `Create new ${activeView.slice(0, -1)}`);
  };

  const renderItem = (item: any) => {
    let title = '', subtitle = '', metadata = '';

    switch (activeView) {
      case 'templates':
        title = item.name;
        subtitle = `${item.age_group} • ${item.subject_area}`;
        metadata = `${item.total_weeks} weeks • ${item.difficulty_level}`;
        break;
      case 'items':
        title = item.title;
        subtitle = item.description || item.activity_type;
        metadata = `Week ${item.week_number}, Day ${item.day_number} • ${item.estimated_duration}min`;
        break;
      case 'assignments':
        title = item.curriculum_templates?.name || 'Assignment';
        subtitle = item.classes?.name || 'Class';
        metadata = `${new Date(item.start_date).toLocaleDateString()} - ${new Date(item.end_date).toLocaleDateString()}`;
        break;
      case 'executions':
        title = item.curriculum_items?.title || 'Activity';
        subtitle = `${item.classes?.name} • ${item.users?.first_name} ${item.users?.last_name}`;
        metadata = `${item.completion_status} • ${new Date(item.execution_date).toLocaleDateString()}`;
        break;
    }

    return (
      <CrudCard
        key={item.id}
        item={item}
        title={title}
        subtitle={subtitle}
        metadata={metadata}
        onEdit={() => console.log('Edit', item.id)}
        onDelete={() => console.log('Delete', item.id)}
        onView={() => console.log('View', item.id)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <CrudHeader
        title="Curriculum Management"
        subtitle={`Manage ${activeView} and track progress`}
        onAdd={handleAdd}
        addButtonText={`Add ${activeView.slice(0, -1)}`}
        extraActions={getExtraActions()}
      />

      <CrudStats stats={getStatsConfig()} />

      {/* View Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {getViewTabs().map(tab => (
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
        loading={loading}
        items={items}
        emptyIcon={<BookOpen size={48} color={colors.gray300} />}
        emptyText={`No ${activeView} found`}
        renderItem={renderItem}
        onRefresh={fetchData}
      />
    </View>
  );
};

const styles = {
  tabContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.gray600 },
  activeTabText: { color: colors.primary, fontWeight: '600' as const }
};