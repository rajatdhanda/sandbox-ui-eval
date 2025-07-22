// app/(tabs)/(teacher)/activities.tsx
//checked
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useEntityOptions } from '@/hooks/use-entity-options';
import { DailyActivityCalendar } from '@/app/components/shared/daily-activity-calendar';
import { QuickObservationPanel } from '@/app/components/shared/quick-observation-panel';
import { LoadingState, EmptyState} from '@/app/components/shared/empty-state';
import { colors } from '@/lib/styles';
import type { 
  ActivitySchedule, 
  ObservationData 
} from '@/app/components/shared/type/data-service.types';

export default function ActivitiesTab() {
  const { user, loading: authLoading } = useAuth();
  const { childOptions, loading: childrenLoading } = useEntityOptions({ children: true });
  
  const [showObservationPanel, setShowObservationPanel] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivitySchedule | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const classId = user?.classId;
  
  // Transform children data with proper error handling
  const classChildren = useMemo(() => {
    if (!classId || !childOptions) return [];
    
    try {
      return childOptions
        .filter(child => child.metadata?.enrollment?.classId === classId)
        .map(child => ({
          id: child.id,
          firstName: child.metadata?.first_name || '',
          lastName: child.metadata?.last_name || '',
          name: child.label,
          photoUrl: child.metadata?.profile_photo || undefined,
          present: true // TODO: Get from attendance data
        }));
    } catch (error) {
      console.error('[Activities] Error transforming children:', error);
      return [];
    }
  }, [childOptions, classId]);
  
  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Calendar component will auto-refresh through its hook
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);
  
  // Handle activity selection
  const handleActivityPress = (activity: ActivitySchedule) => {
    console.log('[Activities] Activity selected:', activity);
    setSelectedActivity(activity);
  };
  
  // Handle quick note button
  const handleQuickNote = (activityId: string, childId?: string) => {
    console.log('[Activities] Quick note for activity:', activityId);
    setSelectedActivity({ id: activityId } as ActivitySchedule);
    setShowObservationPanel(true);
  };
  
  // Handle photo upload button
  const handlePhotoUpload = (activityId: string) => {
    console.log('[Activities] Photo upload for activity:', activityId);
    Alert.alert('Coming Soon', 'Photo capture will be available soon');
  };
  
  // Handle observation submission
  const handleObservationSubmit = (observation: ObservationData) => {
    console.log('[Activities] Observation saved by panel');
    setShowObservationPanel(false);
    setSelectedActivity(null);
  };
  
  // Loading states
  if (authLoading || childrenLoading) {
    return <LoadingState message="Loading activities..." />;
  }
  
  
  // No class assigned
  if (!classId) {
    return (
      <EmptyState 
        title="No class assigned" 
        subtitle="Please contact your administrator"
      />
    );
  }
  
  // No children but has class
  if (classChildren.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <DailyActivityCalendar
          classId={classId}
          onActivityPress={handleActivityPress}
          onQuickNote={handleQuickNote}
          onPhotoUpload={handlePhotoUpload}
          showTimeSlots={true}
          compactMode={false}
        />
      </ScrollView>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <DailyActivityCalendar
          classId={classId}
          onActivityPress={handleActivityPress}
          onQuickNote={handleQuickNote}
          onPhotoUpload={handlePhotoUpload}
          showTimeSlots={true}
          compactMode={false}
        />
      </ScrollView>
      
      <QuickObservationPanel
        visible={showObservationPanel}
        onClose={() => {
          setShowObservationPanel(false);
          setSelectedActivity(null);
        }}
        activityId={selectedActivity?.id}
        activityTitle={
          selectedActivity?.curriculumItem?.title || 
          selectedActivity?.curriculum_item?.title || 
          'Activity Observation'
        }
        children={classChildren}
        onSubmit={handleObservationSubmit}
        allowDraft={true}
        maxCharacters={500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  }
});