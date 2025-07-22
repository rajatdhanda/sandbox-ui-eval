// app/(tabs)/(teacher)/summary.tsx
// Path: app/(tabs)/(teacher)/summary.tsx
// BIBLE COMPLIANT: Thin orchestrator under 100 lines

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

// ✅ BIBLE: Import types FIRST
import type { Child } from '@/app/components/shared/type/data-service.types';

// ✅ BIBLE: Import shared components
import { EmptyState, LoadingState } from '@/app/components/shared/empty-state';

// ✅ BIBLE: Import composite view component
import { ObservationSummaryView } from '@/app/components/teacher/observation-summary-view';

// ✅ BIBLE: Import hooks
import { useAuth } from '@/hooks/use-auth';
import { useEntityOptions } from '@/hooks/use-entity-options';

// ✅ BIBLE: Import styles
import { colors } from '@/lib/styles';

export default function SummaryScreen() {
  // ✅ BIBLE: Hooks at top level
  const { user } = useAuth();
  const classId = user?.classId;
  
  const { childOptions, loading: childrenLoading } = useEntityOptions({ children: true });
  
  // ✅ Filter class children
  const classChildren = childOptions
    .filter(child => child.metadata?.enrollment?.classId === classId)
    .map(child => ({
      id: child.id,
      firstName: child.metadata?.first_name || child.label.split(' ')[0],
      lastName: child.metadata?.last_name || '',
      name: child.label,
      photoUrl: child.metadata?.photo_url
    })) as Child[];

  // ✅ Handle loading state
  if (childrenLoading) {
    return <LoadingState message="Loading class data..." />;
  }
  
  // ✅ Handle no class assigned
  if (!classId) {
    return (
      <EmptyState
        title="No Class Assigned"
        subtitle="Please contact your administrator"
      />
    );
  }

  // ✅ Render the main composite view
  return (
    <View style={styles.container}>
      <ObservationSummaryView 
        classId={classId}
        classChildren={classChildren}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});