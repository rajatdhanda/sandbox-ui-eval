// app/(tabs)/(teacher)/progress.tsx
// Path: app/(tabs)/(teacher)/progress.tsx

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';

// ✅ BIBLE: Import types first
import type { Child } from '@/app/components/shared/types/data-service.types';

// ✅ BIBLE: Import shared components
import { ProgressTimeline } from '@/app/components/shared/progress-timeline';
import { StudentSelector } from '@/app/components/shared/student-selector';
import { LoadingState, EmptyState } from '@/app/components/shared/empty-state';
import { TabNavigation } from '@/app/components/shared/tab-navigation';

// ✅ BIBLE: Import hooks
import { useAuth } from '@/hooks/use-auth';
import { useEntityOptions } from '@/hooks/use-entity-options';

// ✅ BIBLE: Import styles
import { colors, spacing, typography } from '@/lib/styles';

type ViewMode = 'class' | 'individual';

export default function ProgressTab() {
  const { user } = useAuth();
  const { childOptions, loading } = useEntityOptions({ children: true });
  
  const [selectedView, setSelectedView] = useState<ViewMode>('individual');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const classId = user?.classId;
  
  const classChildren = useMemo(() => {
    if (!classId || !childOptions) return [];
    return childOptions
      .filter(child => child.metadata?.enrollment?.classId === classId)
      .map(child => ({
        id: child.id,
        firstName: child.metadata?.first_name || '',
        lastName: child.metadata?.last_name || '',
        name: child.label,
        photoUrl: child.metadata?.profile_photo,
        present: true
      }));
  }, [childOptions, classId]);
  
  if (loading) {
    return <LoadingState message="Loading progress..." />;
  }
  
  if (!classId) {
    return <EmptyState title="No class assigned" subtitle="Contact administrator" />;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TabNavigation
          tabs={[
            { key: 'individual', label: 'Individual' },
            { key: 'class', label: 'Class View' }
          ]}
          activeTab={selectedView}
          onTabChange={(tab) => setSelectedView(tab as ViewMode)}
        />
      </View>
      
      <ScrollView style={styles.content}>
        {selectedView === 'individual' && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Select a student</Text>
            <StudentSelector
              students={classChildren}
              selectedIds={selectedChildId ? [selectedChildId] : []}
              onSelectionChange={(ids) => setSelectedChildId(ids[0] || null)}
              mode="single"
            />
          </View>
        )}
        
        {selectedChildId && selectedView === 'individual' ? (
          <ProgressTimeline
            childId={selectedChildId}
            dateRange="week"
            showMilestones={true}
          />
        ) : selectedView === 'class' ? (
          <EmptyState 
            title="Class View Coming Soon" 
            subtitle="Individual progress available now"
          />
        ) : (
          <EmptyState 
            title="Select a student" 
            subtitle="Choose a student to view their progress"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  selectorContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  selectorLabel: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  }
});