// components/shared/relationship-manager.tsx
import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Users, BookOpen, School, CheckCircle2, ArrowRight, Edit2 } from 'lucide-react-native';
import { EntitySelector } from './entity-selector';
import { db } from '@/lib/supabase/services/database.service';
import { RELATIONSHIP_CONFIGS } from '@/lib/types/relationships';
import { colors } from '@/lib/styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: keyof typeof RELATIONSHIP_CONFIGS;
  title: string;
}

export function RelationshipManagerMini({ visible, onClose, type, title }: Props) {
  const [entities, setEntities] = useState<{ parents: any[]; children: any[] }>({ parents: [], children: [] });
  const [relationships, setRelationships] = useState<any[]>([]);
  const [selected, setSelected] = useState({ parent: '', child: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const config = RELATIONSHIP_CONFIGS[type];
  const fieldMap = { 
    parent_child: { p: 'parent_id', c: 'child_id' }, 
    teacher_class: { p: 'teacher_id', c: 'class_id' }, 
    curriculum_class: { p: 'curriculum_id', c: 'class_id' } 
  }[type];

  const getIcon = () => ({
    parent_child: <Users size={24} color="#8B5CF6" />,
    teacher_class: <School size={24} color="#EC4899" />,
    curriculum_class: <BookOpen size={24} color="#F97316" />
  })[type];

  useEffect(() => { if (visible) fetchData(); }, [visible]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parents, children, rels] = await Promise.all([
        db.read(config.parentEntity.table as any, { filters: config.parentEntity.filters || {} }),
        db.read(config.childEntity.table as any, { filters: config.childEntity.filters || {} }),
        db.read(config.relationshipTable as any, {})
      ]);
      setEntities({ parents: parents.data || [], children: children.data || [] });
      setRelationships(rels.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entity: any, field: string) => 
    field.split(',').map(f => entity?.[f.trim()]).filter(Boolean).join(' ') || 'Unknown';

  const handleSave = async () => {
    if (!selected.parent || !selected.child) {
      Alert.alert('Error', 'Please select both entities');
      return;
    }
    
    // Build data with type-specific fields
    const baseData = { [fieldMap.p]: selected.parent, [fieldMap.c]: selected.child };
    
    const typeSpecificData = {
      parent_child: { relationship_type: 'parent', is_primary: true },
      teacher_class: { is_primary: false, assigned_date: new Date().toISOString().split('T')[0] },
      curriculum_class: { 
        start_date: new Date().toISOString().split('T')[0], 
        is_active: true,
        notes: '' 
      }
    };
    
    const data = { ...baseData, ...typeSpecificData[type] };
    
    const result = editing 
      ? await db.update(config.relationshipTable as any, data, { id: editing.id })
      : await db.create(config.relationshipTable as any, data);
    
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      Alert.alert('Success', `Relationship ${editing ? 'updated' : 'created'} successfully`);
      closeForm();
      fetchData();
    }
  };

  const handleEdit = (item: any) => {
    setSelected({ parent: item[fieldMap.p], child: item[fieldMap.c] });
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (item: any) => {
    const result = await db.delete(config.relationshipTable as any, { id: item.id }, { hard: true });
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      Alert.alert('Success', 'Relationship deleted');
      fetchData();
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected({ parent: '', child: '' });
    setEditing(null);
  };

  const enrichedItems = relationships.map(item => ({
    ...item,
    parentEntity: entities.parents.find(p => p.id === item[fieldMap.p]),
    childEntity: entities.children.find(c => c.id === item[fieldMap.c])
  }));

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {getIcon()}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{relationships.length} relationships</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{relationships.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{relationships.filter(r => r.is_active !== false).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Add Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
            <Plus size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add Relationship</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : enrichedItems.length === 0 ? (
            <View style={styles.emptyState}>
              {getIcon()}
              <Text style={styles.emptyTitle}>No relationships found</Text>
              <Text style={styles.emptySubtext}>Click "Add Relationship" to create the first one</Text>
            </View>
          ) : (
            enrichedItems.map((item) => {
              const parentName = getDisplayName(item.parentEntity, config.parentEntity.displayField);
              const childName = getDisplayName(item.childEntity, config.childEntity.displayField);
              
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.relationshipFlow}>
                      <Text style={styles.parentName}>{parentName}</Text>
                      <ArrowRight size={16} color={colors.gray400} style={styles.arrowIcon} />
                      <Text style={styles.childName}>{childName}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                        <Edit2 size={16} color={colors.blue600} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                        <X size={16} color={colors.red600} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    {item.is_primary && (
                      <View style={styles.primaryBadge}>
                        <CheckCircle2 size={12} color={colors.green600} />
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                    {item.created_at && (
                      <Text style={styles.timestampText}>
                        Created: {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Form Modal */}
        {showForm && (
          <Modal visible={showForm} animationType="slide">
            <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{editing ? 'Edit' : 'Add'} Relationship</Text>
                <TouchableOpacity onPress={closeForm} style={styles.closeButton}>
                  <X size={24} color={colors.gray600} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContent}>
                <EntitySelector 
                  title={`Select ${config.parentEntity.table.slice(0, -1).replace('_', ' ')}`}
                  entities={entities.parents} 
                  selectedId={selected.parent} 
                  onSelect={(id) => setSelected({...selected, parent: id})} 
                  getDisplayName={(e) => getDisplayName(e, config.parentEntity.displayField)} 
                />
                <EntitySelector 
                  title={`Select ${config.childEntity.table.slice(0, -1).replace('_', ' ')}`}
                  entities={entities.children} 
                  selectedId={selected.child} 
                  onSelect={(id) => setSelected({...selected, child: id})} 
                  getDisplayName={(e) => getDisplayName(e, config.childEntity.displayField)} 
                />
                
                <TouchableOpacity 
                  style={[styles.submitButton, (!selected.parent || !selected.child) && styles.submitButtonDisabled]} 
                  onPress={handleSave}
                  disabled={!selected.parent || !selected.child}
                >
                  <Text style={styles.submitButtonText}>
                    {editing ? 'Update' : 'Create'} Relationship
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row' as const, alignItems: 'center' as const },
  headerTextContainer: { marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600' as const, color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  closeButton: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  statsContainer: { flexDirection: 'row' as const, padding: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, padding: 16, borderRadius: 12, alignItems: 'center' as const, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '700' as const, color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actionContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  addButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#8B5CF6', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' as const, marginLeft: 8 },
  listContainer: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 20 },
  loadingText: { textAlign: 'center' as const, color: '#6B7280', marginTop: 40 },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: '#374151', marginTop: 16, marginBottom: 8, textAlign: 'center' as const },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' as const, lineHeight: 20 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 12 },
  relationshipFlow: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, marginRight: 12 },
  parentName: { fontSize: 16, fontWeight: '600' as const, color: '#1F2937', flex: 1 },
  arrowIcon: { marginHorizontal: 8 },
  childName: { fontSize: 16, fontWeight: '600' as const, color: '#1F2937', flex: 1, textAlign: 'right' as const },
  cardActions: { flexDirection: 'row' as const, gap: 8 },
  editButton: { padding: 8, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  deleteButton: { padding: 8, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  cardBody: { gap: 8 },
  primaryBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' as const, borderWidth: 1, borderColor: '#BBF7D0' },
  primaryText: { fontSize: 12, fontWeight: '600' as const, color: '#16A34A', marginLeft: 4 },
  timestampText: { fontSize: 12, color: '#9CA3AF' },
  formContent: { flex: 1, padding: 20 },
  submitButton: { backgroundColor: '#8B5CF6', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' as const, marginTop: 24, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' as const },
};