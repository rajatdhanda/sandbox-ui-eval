// app/components/teacher/daily-dashboard.tsx
// Path: app/components/teacher/daily-dashboard.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Users, CheckCircle2, TrendingUp, X } from 'lucide-react-native';

// ✅ Add type imports
import type { 
  Child,
  ActivityWithProgress
} from '@/app/components/shared/type/data-service.types';

// Keep all original imports
import { QuickObservationPanel } from '../shared/quick-observation-panel';
import { MediaUploader } from '../shared/media-components';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { useAttachments } from '@/hooks/use-attachments';
import { useRelationships } from '@/hooks/use-relationships';
import { StatCards } from '../shared/stat-cards';
import { DailyActivityCalendar } from '../shared/daily-activity-calendar';
import { StudentProgressGrid } from '../shared/student-progress-grid';
import { TabNavigation } from '../shared/tab-navigation';
import { KMapRadarChart } from '../shared/kmap-radar-chart';
import { ProgressTimeline } from '../shared/progress-timeline';
import { EmptyState, LoadingState } from '../shared/empty-state';
import { useTeacherDailyActivities } from '@/hooks/use-teacher-daily-activities';
import { useEntityOptions } from '@/hooks/use-entity-options';
import { colors, spacing, typography, shadows } from '@/lib/styles';

// ✅ Fix interface - no any!
interface TeacherDailyDashboardProps {
  classId: string;
  teacherId: string;
  onActivityPress?: (activity: ActivityWithProgress) => void;
  onStudentPress?: (student: Child) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function TeacherDailyDashboard({
  classId,
  teacherId,
  onActivityPress,
  onStudentPress,
  onNavigateToTab
}: TeacherDailyDashboardProps) {
  // ✅ Remove useAuth - use props instead
  
  const [activeTab, setActiveTab] = useState('today');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentDate = new Date().toISOString().split('T')[0];

  // Use hooks with passed classId
  const { 
    activities, 
    loading: activitiesLoading, 
    activitySummary,
    markClassComplete,
    refresh: refreshActivities
  } = useTeacherDailyActivities(classId);

  const { childOptions, loading: childrenLoading } = useEntityOptions({ children: true });
  
  const classChildren = childOptions.filter(child => 
    child.metadata?.enrollment?.classId === classId
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshActivities();
    setRefreshing(false);
  };

  const statsConfig = [
    { 
      icon: <Calendar size={24} color={colors.primary} />, 
      value: activities.length, 
      label: "Today's Activities" 
    },
    { 
      icon: <Users size={24} color={colors.info} />, 
      value: classChildren.length, 
      label: 'Students' 
    },
    { 
      icon: <CheckCircle2 size={24} color={colors.success} />, 
      value: activitySummary?.completed || 0, 
      label: 'Completed' 
    },
    { 
      icon: <TrendingUp size={24} color={colors.accent} />, 
      value: `${Math.round(activitySummary?.completionRate || 0)}%`, 
      label: 'Progress' 
    }
  ];

  const tabs = [
    { key: 'today', label: 'Today', count: activities.length },
    { key: 'children', label: 'Students', count: classChildren.length },
    { key: 'progress', label: 'Progress' },
    { key: 'insights', label: 'K-Map' }
  ];

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    onNavigateToTab?.(tabKey);
  };

  const isLoading = activitiesLoading || childrenLoading;

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // ✅ Remove K-Map hardcoded function
  
  return (
    <View style={styles.container}>
      {/* Header - keep original greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <StatCards stats={statsConfig} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabSection}>
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Today's Activities - KEEP ORIGINAL PROPS */}
          {activeTab === 'today' && (
            <DailyActivityCalendar
              classId={classId}
              onActivityPress={(activity) => {
                console.log('Activity pressed:', activity);
                onActivityPress?.(activity);
              }}
              onQuickNote={(activityId, childId) => {
                console.log('Note button pressed for activity:', activityId);
                setSelectedActivityId(activityId);
                setShowNoteModal(true);
              }}
              onPhotoUpload={(activityId) => {
                console.log('Photo button pressed for activity:', activityId);
                setSelectedActivityId(activityId);
                setShowPhotoModal(true);
              }}
              showTimeSlots={true}
            />
          )}

          {/* Students Grid - KEEP ORIGINAL */}
          {activeTab === 'children' && (
            <StudentProgressGrid
              students={classChildren.map(child => ({
                id: child.id,
                name: child.label,
                ...child.metadata
              }))}
              onStudentPress={(student) => {
                setSelectedChildId(student.id);
                onStudentPress?.(student);
              }}
            />
          )}
          
          {/* Progress Timeline - KEEP ORIGINAL */}
          {activeTab === 'progress' && (
            <View>
              {selectedChildId ? (
                <ProgressTimeline
                  childId={selectedChildId}
                  dateRange="week"
                  showMilestones={true}
                />
              ) : (
                <EmptyState
                  title="Select a Student"
                  subtitle="Choose a student from the Students tab to view their progress"
                />
              )}
            </View>
          )}
          
          {/* K-Map Insights - REMOVE HARDCODED DATA */}
          {activeTab === 'insights' && (
            <View style={styles.insightsContainer}>
              <EmptyState
                title="K-Map Analysis Coming Soon"
                subtitle="Class K-Map analytics will be available once we have enough data"
              />
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Note Modal - KEEP ORIGINAL PROPS */}
      {showNoteModal && selectedActivityId && (
        <QuickObservationPanel
        
          visible={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            refreshActivities();
          }}
          activityId={selectedActivityId}
          activityTitle="Class Activity"
          onSubmit={(observation) => {
            console.log('Observation submitted:', observation);
            setShowNoteModal(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            refreshActivities();
          }}
          allowDraft={false}
          maxCharacters={500}
          children={classChildren.map(child => ({
            id: child.id,
            firstName: child.metadata?.first_name || child.label.split(' ')[0],
            lastName: child.metadata?.last_name || child.label.split(' ')[1] || '',
            name: child.label,
            photoUrl: child.metadata?.profile_photo
          }))}
        />
      )}

      {/* Photo Modal - KEEP ORIGINAL onUpload */}
      {showPhotoModal && selectedActivityId && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPhotoModal(false)}
            >
              <X size={24} color={colors.gray600} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Upload Photo</Text>
            <MediaUploader
              onUpload={(files) => {
                console.log('Photos uploaded:', files);
                setShowPhotoModal(false);
              }}
              accept="image/*"
              multiple={true}
              maxSize={5}
              maxFiles={3}
              showPreview={true}
            />
          </View>
        </View>
      )}
      
      {/* Success Message */}
      {showSuccess && (
        <View style={styles.successMessage}>
          <CheckCircle2 size={20} color={colors.white} />
          <Text style={styles.successText}>Observation saved successfully!</Text>
        </View>
      )}
    </View>
  );
}

// Keep original styles exactly as they are
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsSection: {
    paddingVertical: spacing.md,
  },
  tabSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginVertical: spacing.md,
  },
  insightsContainer: {
    flex: 1,
  },
  centerChart: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 1,
  },
  successMessage: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  successText: {
    color: colors.white,
    fontWeight: '600',
  },
});