// app/(tabs)/(teacher)/students.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useRelationships } from '@/hooks/use-relationships';
import { useKMapAnalytics } from '@/hooks/use-kmap-analytics';
import { useLearningTracking } from '@/hooks/use-learning-tracking';
import { useMilestoneTracking } from '@/hooks/use-milestone-tracking';
import { StudentProgressGrid } from '@/app/components/shared/student-progress-grid';
import { QuickObservationPanel } from '@/app/components/shared/quick-observation-panel';
import { LoadingState, EmptyState, ErrorState } from '@/app/components/shared/empty-state';
import { StatCards } from '@/app/components/shared/stat-cards';
import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/styles';
import type { Child, ProgressTrackingObservation, KMapScores } from '@/app/components/shared/type/data-service.types';

export default function StudentsTab() {
  const { user, loading: authLoading } = useAuth();
  // FIXED: Call hook at top level
  const { getClassWithAllData, loading: classLoading } = useRelationships();
  const { calculateChildKMap, compareToClassAverage, loading: kmapLoading } = useKMapAnalytics();
  const { getObservationsByContext } = useLearningTracking();
  const { getMilestoneProgress } = useMilestoneTracking();
  
  const [classData, setClassData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showObservationPanel, setShowObservationPanel] = useState(false);
  const [observations, setObservations] = useState<ProgressTrackingObservation[]>([]);
  const [kMapScores, setKMapScores] = useState<Record<string, KMapScores>>({});
  const [milestoneData, setMilestoneData] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const classId = user?.classId;
  
  // Load class data with enrolled children
  useEffect(() => {
    const loadClassData = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getClassWithAllData(classId);
        console.log('[Students] Class data loaded:', data);
        setClassData(data);
      } catch (error) {
        console.error('[Students] Error loading class data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadClassData();
  }, [classId, getClassWithAllData]);
  
  // Transform enrolled children to expected format
  const classChildren = useMemo(() => {
    if (!classData?.enrolled_children) return [];
    
    // The enrolled_children array contains objects with child property
    return classData.enrolled_children.map((enrollment: any) => ({
      value: enrollment.child.id,
      label: `${enrollment.child.first_name} ${enrollment.child.last_name}`,
      metadata: {
        firstName: enrollment.child.first_name,
        lastName: enrollment.child.last_name,
        profilePhoto: enrollment.child.profile_photo,
        enrollment: {
          classId: classId,
          status: 'enrolled'
        }
      }
    }));
  }, [classData, classId]);
  
  // Load other data after class data is loaded
  const loadAllData = useCallback(async () => {
    if (!classId || classChildren.length === 0) return;
    
    try {
      // Load observations
      const obsResult = await getObservationsByContext({
        level: 'class',
        id: classId,
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });
      
      if (obsResult.success && obsResult.data) {
        setObservations(obsResult.data);
      }
      
      // Load K-Map scores and milestone data for each child
      const kMapData: Record<string, KMapScores> = {};
      const milestones: Record<string, any> = {};
      
      await Promise.all(
        classChildren.map(async (child) => {
          try {
            // Load K-Map scores
            const kmap = await calculateChildKMap(child.value);
            if (kmap?.scores) {
              kMapData[child.value] = kmap.scores;
            }
            
            // Load milestone progress
            const milestone = await getMilestoneProgress(child.value, { period: 'week' });
            if (milestone) {
              milestones[child.value] = milestone;
            }
          } catch (error) {
            console.error(`Error loading data for child ${child.value}:`, error);
          }
        })
      );
      
      setKMapScores(kMapData);
      setMilestoneData(milestones);
      
    } catch (error) {
      console.error('[Students] Error loading data:', error);
    }
  }, [classId, classChildren, getObservationsByContext, calculateChildKMap, getMilestoneProgress]);
  
  // Load other data when children are available
  useEffect(() => {
    if (classId && classChildren.length > 0) {
      loadAllData();
    }
  }, [classId, classChildren.length, loadAllData]);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Reload class data first
    if (classId) {
      try {
        const data = await getClassWithAllData(classId);
        setClassData(data);
      } catch (error) {
        console.error('[Students] Error refreshing class data:', error);
      }
    }
    
    await loadAllData();
    setRefreshing(false);
  }, [classId, getClassWithAllData, loadAllData]);
  
  // Transform children for StudentProgressGrid with K-Map scores
  // Transform children for StudentProgressGrid with K-Map scores
const studentsData = useMemo(() => {
  return classChildren.map(child => {
    // Get observations for this child
    const childObs = observations.filter(o => o.child_id === child.value);
    
    // Calculate weekly progress
    const weeklyObsCount = childObs.length;
    const targetObsPerWeek = 10;
    const progressPercentage = Math.min((weeklyObsCount / targetObsPerWeek) * 100, 100);
    
    // Determine if needs attention (less than 2 observations in past week)
    const needsAttention = weeklyObsCount < 2;
    
    // Get K-Map scores or default - ONLY DECLARE ONCE
    const childKMap = kMapScores[child.value] || { move: 0, think: 0, endure: 0 };
    
    // Make sure all properties exist
    const safeKmapScores = {
      move: childKMap.move || 0,
      think: childKMap.think || 0,
      endure: childKMap.endure || 0
    };
    
    // Determine trend based on observations and K-Map balance
    const kmapBalance = Math.abs(safeKmapScores.move - safeKmapScores.think) + 
                       Math.abs(safeKmapScores.think - safeKmapScores.endure) + 
                       Math.abs(safeKmapScores.endure - safeKmapScores.move);
    const isBalanced = kmapBalance < 30; // Within 30 points is considered balanced
    
    const trend = weeklyObsCount >= 5 && isBalanced ? 'improving' as const : 
                 weeklyObsCount >= 3 ? 'stable' as const : 
                 'declining' as const;
    
    return {
      id: child.value,
      firstName: child.metadata?.firstName || '',
      lastName: child.metadata?.lastName || '',
      photoUrl: child.metadata?.profilePhoto,
      attendance: {
        present: true,
        status: 'present' as const
      },
      dailyProgress: {
        completed: weeklyObsCount,
        total: targetObsPerWeek,
        percentage: progressPercentage
      },
      kmapScores: safeKmapScores,
      previousKmapScores: undefined,
      trend,
      needsAttention: needsAttention || !isBalanced
    };
  });
}, [classChildren, observations, kMapScores]);
  
  // Calculate class analytics with real data
  const classAnalytics = useMemo(() => {
    const totalStudents = studentsData.length;
    const studentsNeedingSupport = studentsData.filter(s => s.needsAttention).length;
    
    // Calculate average progress
    const avgProgress = totalStudents > 0
      ? studentsData.reduce((sum, s) => sum + s.dailyProgress.percentage, 0) / totalStudents
      : 0;
    
    // Calculate total milestones achieved this week
    const totalMilestones = Object.values(milestoneData)
      .reduce((sum, m: any) => sum + (m?.achieved || 0), 0);
    
    // Calculate class average K-Map
    const classAvgKMap = totalStudents > 0 ? {
      move: studentsData.reduce((sum, s) => sum + s.kmapScores.move, 0) / totalStudents,
      think: studentsData.reduce((sum, s) => sum + s.kmapScores.think, 0) / totalStudents,
      endure: studentsData.reduce((sum, s) => sum + s.kmapScores.endure, 0) / totalStudents
    } : { move: 0, think: 0, endure: 0 };
    
    return {
      averageProgress: avgProgress,
      totalMilestones,
      needsSupport: studentsNeedingSupport,
      classAvgKMap
    };
  }, [studentsData, milestoneData]);
  
  const stats = useMemo(() => [
    { 
      icon: <Users size={24} color={colors.primary} />, 
      value: studentsData.length, 
      label: 'Students' 
    },
    { 
      icon: <TrendingUp size={24} color={colors.success} />, 
      value: `${Math.round(classAnalytics.averageProgress)}%`, 
      label: 'Avg Progress' 
    },
    { 
      icon: <Award size={24} color={colors.warning} />, 
      value: classAnalytics.totalMilestones, 
      label: 'Milestones' 
    },
    { 
      icon: <AlertCircle size={24} color={colors.error} />, 
      value: classAnalytics.needsSupport, 
      label: 'Need Support' 
    }
  ], [studentsData, classAnalytics]);
  
  const handleStudentPress = useCallback((student: any) => {
    setSelectedStudentId(student.id);
    setShowObservationPanel(true);
  }, []);
  
  const handleObservationSubmit = useCallback(() => {
    setShowObservationPanel(false);
    setSelectedStudentId(null);
    // Refresh all data
    loadAllData();
  }, [loadAllData]);
  
  // Loading states
  if (authLoading || loading || classLoading || kmapLoading) {
    return <LoadingState message="Loading students..." />;
  }
  
  // No class assigned
  if (!classId) {
    return (
      <EmptyState 
        title="No Class Assigned" 
        subtitle="Please contact your administrator to get assigned to a class."
      />
    );
  }
  
  // No students enrolled
  if (!classData?.enrolled_children || classData.enrolled_children.length === 0) {
    return (
      <EmptyState 
        title="No Students Enrolled" 
        subtitle="No students are currently enrolled in your class."
      />
    );
  }
  
  // Get selected child data for observation panel
  const selectedChild = classChildren.find(c => c.value === selectedStudentId);
  const childrenForPanel = selectedChild ? [{
    id: selectedChild.value,
    firstName: selectedChild.metadata?.firstName || '',
    lastName: selectedChild.metadata?.lastName || '',
    name: selectedChild.label,
    photoUrl: selectedChild.metadata?.profilePhoto
  }] : [];
  
  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Students</Text>
          <Text style={styles.subtitle}>
            {classChildren.length} students enrolled
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <StatCards stats={stats} columns={2} />
        </View>
        
        {/* Class K-Map Average (optional feature) */}
        {classAnalytics.classAvgKMap && (
          <View style={styles.classAvgContainer}>
            <Text style={styles.sectionTitle}>Class Average K-Map</Text>
            <View style={styles.kmapValues}>
              <Text style={styles.kmapText}>
                Move: {Math.round(classAnalytics.classAvgKMap.move)}
              </Text>
              <Text style={styles.kmapText}>
                Think: {Math.round(classAnalytics.classAvgKMap.think)}
              </Text>
              <Text style={styles.kmapText}>
                Endure: {Math.round(classAnalytics.classAvgKMap.endure)}
              </Text>
            </View>
          </View>
        )}
        
        <StudentProgressGrid
          students={studentsData}
          onStudentPress={handleStudentPress}
          showFilters={true}
          showSearch={classChildren.length > 10}
          view="grid"
        />
      </ScrollView>
      
      <QuickObservationPanel
        visible={showObservationPanel}
        onClose={() => {
          setShowObservationPanel(false);
          setSelectedStudentId(null);
        }}
        childId={selectedStudentId || undefined}
        children={childrenForPanel}
        onSubmit={handleObservationSubmit}
      />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.h4,
    fontWeight: '600' as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  classAvgContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600' as any,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  kmapValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  kmapText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  }
});