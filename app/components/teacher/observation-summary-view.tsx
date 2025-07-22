// app/components/teacher/observation-summary-view.tsx
// Path: app/components/teacher/observation-summary-view.tsx
// Teacher-specific composite view for observation summary

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAttachments } from '@/hooks/use-attachments';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Tag,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp
} from 'lucide-react-native';

// ✅ Import types
import type { 
  Child,
  ProgressTrackingObservation 
} from '@/app/components/shared/type/data-service.types';

// ✅ Import shared components
import { QuickObservationPanel } from '@/app/components/shared/quick-observation-panel';
import { EmptyState, ErrorState } from '@/app/components/shared/empty-state';
import { StatCards } from '@/app/components/shared/stat-cards';

// ✅ Import hooks
import { useLearningTracking } from '@/hooks/use-learning-tracking';

// ✅ Import styles
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

interface ObservationSummaryViewProps {
  classId: string;
  classChildren: Child[];
}

// Type for parsed observation
interface ParsedObservation extends ProgressTrackingObservation {
  parsedType: string;
  parsedDescription: string;
  parsedTags: string[];
  childData?: Child;
  attachments?: any[]; // Add this line
}

// Observation type config
const OBSERVATION_TYPE_CONFIG = {
  behavioral: { color: colors.info, label: 'Behavioral' },
  academic: { color: colors.success, label: 'Academic' },
  social: { color: colors.warning, label: 'Social' },
  physical: { color: colors.error, label: 'Physical' },
  creative: { color: colors.secondary, label: 'Creative' }
};

export function ObservationSummaryView({ classId, classChildren }: ObservationSummaryViewProps) {
  // ✅ Hooks
  const { 
    getObservationsByContext, 
    updateObservation, 
    deleteObservation,
    loading: observationsLoading,
    error: observationsError 
  } = useLearningTracking();
  const { getAttachmentsForProgress } = useAttachments();
  
  // ✅ State
  const [observations, setObservations] = useState<ParsedObservation[]>([]);
  const [showObservationPanel, setShowObservationPanel] = useState(false);
  const [editingObservation, setEditingObservation] = useState<ParsedObservation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // ✅ Load observations
  const loadObservations = useCallback(async () => {
    try {
      const result = await getObservationsByContext({
        level: 'class',
        id: classId,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });
      
      if (result.success && result.data) {
        console.log('Observations loaded:', result.data.length, result.data);
        const parsed = result.data.map(obs => {
          const parsed = parseObservation(obs);
          const childData = classChildren.find(c => c.id === obs.child_id);
          return { ...parsed, childData };
        });
        setObservations(parsed);
      }
    } catch (error) {
      console.error('Error loading observations:', error);
    }
  }, [classId, getObservationsByContext, classChildren]);

  // ✅ Parse observation
  const parseObservation = (obs: ProgressTrackingObservation): ParsedObservation => {
    let parsedType = obs.observation_type || 'behavioral';
    let parsedDescription = '';
    let parsedTags: string[] = [];
    
    if (obs.teacher_notes) {
      const parts = obs.teacher_notes.split(' | ');
      const typeAndDesc = parts[0].split(': ');
      
      if (typeAndDesc.length >= 2) {
        parsedType = typeAndDesc[0];
        parsedDescription = typeAndDesc.slice(1).join(': ');
      } else {
        parsedDescription = obs.teacher_notes;
      }
      
      if (parts.length > 1 && parts[1].startsWith('Tags: ')) {
        parsedTags = parts[1].replace('Tags: ', '').split(', ').filter(Boolean);
      }
    }
    
    return {
      ...obs,
      parsedType,
      parsedDescription,
      parsedTags
    };
  };

  // ✅ Group by date
  const groupedObservations = useMemo(() => {
    const groups = observations.reduce((acc, obs) => {
      const date = new Date(obs.execution_date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(obs);
      return acc;
    }, {} as Record<string, ParsedObservation[]>);
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [observations]);

  // ✅ Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayObs = observations.filter(obs => 
      new Date(obs.execution_date).toDateString() === today
    );
    
    return [
      {
        label: 'Total',
        value: observations.length.toString(),
        icon: <FileText size={20} color={colors.primary} />,
        color: colors.primary
      },
      {
        label: 'Today',
        value: todayObs.length.toString(),
        icon: <Calendar size={20} color={colors.success} />,
        color: colors.success
      },
      {
        label: 'Students',
        value: new Set(observations.map(o => o.child_id)).size.toString(),
        icon: <User size={20} color={colors.info} />,
        color: colors.info
      },
      {
        label: 'This Week',
        value: observations.filter(obs => {
          const obsDate = new Date(obs.execution_date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return obsDate >= weekAgo;
        }).length.toString(),
        icon: <TrendingUp size={20} color={colors.warning} />,
        color: colors.warning
      }
    ];
  }, [observations]);

  // ✅ Load on mount
  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  // Load attachments when editing
useEffect(() => {
  const loadAttachments = async () => {
    if (editingObservation?.id) {
      const result = await getAttachmentsForProgress(editingObservation.id);
      if (result.success && result.data) {
        // Convert to MediaItem format
        const mediaItems = result.data.map(att => ({
          id: att.id,
          url: att.url,
          type: att.type as any,
          name: att.file_name,
          size: att.file_size,
          uploadedAt: att.created_at,
          metadata: {
            bucket: 'attachments',
            mimeType: att.mime_type
          }
        }));
        
        // Update the editingObservation with attachments
        setEditingObservation(prev => prev ? {...prev, attachments: mediaItems} : null);
      }
    }
  };
  
  if (editingObservation) {
    loadAttachments();
  }
}, [editingObservation?.id, getAttachmentsForProgress]);

  // ✅ Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadObservations();
    setIsRefreshing(false);
  }, [loadObservations]);

  const handleDelete = useCallback(async (observationId: string) => {
    Alert.alert(
      'Delete Observation',
      'Are you sure you want to delete this observation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteObservation(observationId);
            if (result.success) {
              await loadObservations();
            }
          }
        }
      ]
    );
  }, [deleteObservation, loadObservations]);

  const handleToggleVisibility = useCallback(async (observation: ParsedObservation) => {
  // Add or remove "hidden" tag based on visibility
  const updatedTags = observation.parent_visible 
    ? [...observation.parsedTags, 'hidden'].filter((tag, index, self) => self.indexOf(tag) === index)
    : observation.parsedTags.filter(tag => tag !== 'hidden');
  
  const result = await updateObservation(observation.id, {
    parentVisible: !observation.parent_visible,
    tags: updatedTags
  });
  
  if (result.success) {
    await loadObservations();
  }
}, [updateObservation, loadObservations]);

  // ✅ Error state
  if (observationsError) {
    return <ErrorState message={observationsError} onRetry={loadObservations} />;
  }

  // ✅ Render
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>
            {observations.length} observations in the last 30 days
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={() => setShowObservationPanel(true)}
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.captureButtonText}>Quick Capture</Text>
        </TouchableOpacity>
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCards stats={stats} columns={4} variant="compact" />
      </View>
      
      {/* Timeline */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {groupedObservations.length === 0 ? (
          <EmptyState
            title="No Observations Yet"
            subtitle="Tap 'Quick Capture' to add your first observation"
            icon={<Calendar size={48} color={colors.gray400} />}
          />
        ) : (
          <View style={styles.timeline}>
            {groupedObservations.map(([date, dateObservations]) => (
              <ObservationDateGroup
                key={date}
                date={date}
                observations={dateObservations}
                isExpanded={expandedDates.has(date)}
                onToggle={() => {
                  setExpandedDates(prev => {
                    const next = new Set(prev);
                    if (next.has(date)) {
                      next.delete(date);
                    } else {
                      next.add(date);
                    }
                    return next;
                  });
                }}
                onEdit={(obs) => {
  setEditingObservation(obs);
  setShowObservationPanel(true);
}}
               
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </View>
        )}
      </ScrollView>


      
      
      {/* Panel */}
  {showObservationPanel && (
  <QuickObservationPanel
    visible={showObservationPanel}
    onClose={() => {
      setShowObservationPanel(false);
      setEditingObservation(null);
    }}
    onSubmit={async (observation) => {
      console.log('Observation saved:', observation);
      setShowObservationPanel(false);
      setEditingObservation(null);
      await loadObservations();
    }}
    children={classChildren.map(child => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      name: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
      present: true,
      photoUrl: child.profilePhoto
    }))}
    allowDraft={false}
    mode={editingObservation ? 'edit' : 'create'}
    initialData={editingObservation ? {
      type: editingObservation.observation_type as any,
      description: editingObservation.parsedDescription,
      tags: editingObservation.parsedTags,
      parentVisible: editingObservation.parent_visible,
      childId: editingObservation.child_id
    } : undefined}
    childId={editingObservation?.child_id}
    childName={editingObservation?.childData ? 
      `${editingObservation.childData.firstName} ${editingObservation.childData.lastName}` : 
      undefined
    }
    existingAttachments={editingObservation?.attachments || []}
  />
)}
    </>
  );
}

// ✅ Separate component for date groups
interface ObservationDateGroupProps {
  date: string;
  observations: ParsedObservation[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (obs: ParsedObservation) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (obs: ParsedObservation) => void;
}

function ObservationDateGroup({
  date,
  observations,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleVisibility
}: ObservationDateGroupProps) {
  const isToday = new Date(date).toDateString() === new Date().toDateString();
  
  return (
    <View style={styles.dateGroup}>
      <TouchableOpacity style={styles.dateHeader} onPress={onToggle}>
        <View style={styles.dateHeaderLeft}>
          <Text style={[styles.dateText, isToday && styles.todayText]}>
            {isToday ? 'Today' : date}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{observations.length}</Text>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.observationsList}>
          {observations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onEdit={() => onEdit(obs)}
            
              onToggleVisibility={() => onToggleVisibility(obs)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ✅ Observation card component
interface ObservationCardProps {
  observation: ParsedObservation;
  onView: () => void;  // Add this
  onEdit: () => void;
 
  onToggleVisibility: () => void;
}

function ObservationCard({
  observation,
  onEdit,

  onToggleVisibility
}: ObservationCardProps) {
  const typeConfig = OBSERVATION_TYPE_CONFIG[observation.observation_type as keyof typeof OBSERVATION_TYPE_CONFIG] 
    || OBSERVATION_TYPE_CONFIG.behavioral;
  
  return (
    <View style={styles.observationCard}>
      <View style={styles.observationHeader}>
        <View style={styles.childInfo}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
          <Text style={styles.childName}>
            {observation.childData ? 
  `${observation.childData.firstName || ''} ${observation.childData.lastName || ''}`.trim() : 
  observation.children ? 
    `${observation.children.firstName || ''} ${observation.children.lastName || ''}`.trim() :
    'Unknown Child'
}
          </Text>
        </View>
        
        <View style={styles.observationActions}>
          <TouchableOpacity onPress={onToggleVisibility} style={styles.iconButton}>
            {observation.parent_visible ? (
              <Eye size={18} color={colors.success} />
            ) : (
              <EyeOff size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
            <Edit2 size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.observationDescription} numberOfLines={2}>
        {observation.parsedDescription}
      </Text>
      
      {observation.parsedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Tag size={12} color={colors.textSecondary} />
          {observation.parsedTags.map((tag, index) => (
            <Text key={index} style={styles.tag}>{tag}</Text>
          ))}
        </View>
      )}
      
      <View style={styles.observationFooter}>
        <View style={styles.timestampContainer}>
          <Clock size={12} color={colors.textSecondary} />
          <Text style={styles.timestamp}>
            {new Date(observation.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  captureButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeline: {
    padding: spacing.lg,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.text,
  },
  todayText: {
    color: colors.primary,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  observationsList: {
    gap: spacing.sm,
  },
  observationCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  childInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: typography.xs,
    fontWeight: '600',
  },
  childName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.text,
  },
  observationActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
  },
  observationDescription: {
    fontSize: typography.base,
    color: colors.text,
    lineHeight: typography.base * 1.5,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  tag: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  observationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestamp: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
});