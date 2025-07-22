// app/components/shared/type/data-service-reference.ts
// Path: app/components/shared/tye/data-service-reference.ts

/**
 * DATA SERVICE REFERENCE - Complete UI Development Guide
 * =====================================================
 * 
 * This file covers 100% of remaining UI development needs:
 * ✅ Which hook to use (Need #4)
 * ✅ Error handling patterns (Need #5)
 * ✅ Copy-paste examples (Need #6)
 * ✅ Loading state patterns (Need #7)
 * ✅ Common mistakes (Need #8)
 * ✅ When hooks vs DataService (Need #9)
 * ✅ Null safety patterns (Need #10)
 */

import type {
  ServiceResponse,
  Child,
  ProgressRecord,
  ActivitySchedule,
  KMapScores,
  AttendanceRecord,
  EnrichedClassData
} from './types/data-service.types';

/**
 * SECTION 1: QUICK DECISION GUIDE (Need #9)
 * ========================================
 */
export const WhenToUseWhat = {
  inReactComponent: "ALWAYS use hooks - they provide loading states and auto-refresh",
  inApiRoute: "Use DataService static methods or database.service directly",
  inUtilityFunction: "Use DataService static methods or database.service directly",
  inServerSideCode: "Use database.service directly",
  
  examples: {
    correct: {
      component: "const { childOptions, loading } = useEntityOptions({ children: true });",
      apiRoute: "const result = await DataService.getClassChildren(classId);",
      utility: "const data = await db.supabase.from('children').select();"
    },
    wrong: {
      component: "const result = await DataService.getClassChildren(classId); // ❌ No loading state",
      apiRoute: "const { childOptions } = useEntityOptions(); // ❌ Hooks don't work here"
    }
  }
};

/**
 * SECTION 2: COMPLETE OPERATION REFERENCE (Need #4, #6)
 * ====================================================
 */
export const DataOperations = {
  
  // ============================================
  // CHILDREN & ENROLLMENT
  // ============================================
  children: {
    listAll: {
      hook: "useEntityOptions",
      usage: `
// ✅ COMPLETE EXAMPLE - List all children
import { useEntityOptions } from '@/hooks/use-entity-options';

function ChildrenList() {
  const { childOptions, loading, error } = useEntityOptions({ children: true });
  
  // ALWAYS handle loading (Need #7)
  if (loading) return <LoadingState message="Loading children..." />;
  
  // ALWAYS handle errors (Need #5)
  if (error) return <ErrorState error={error} retry={() => window.location.reload()} />;
  
  // ALWAYS handle empty state
  if (!childOptions || childOptions.length === 0) {
    return <EmptyState title="No children found" />;
  }
  
  return (
    <SmartSelect
      options={childOptions}
      value={selectedChild}
      onChange={setSelectedChild}
      placeholder="Select a child"
    />
  );
}`,
      returns: "EntityOption[] with {id, label, subtitle, searchText, metadata}",
      commonMistakes: [
        "Forgetting loading state",
        "Not handling empty array",
        "Using DataService in component"
      ]
    },

    getByClass: {
      hook: "useEntityOptions + filter",
      usage: `
// ✅ COMPLETE EXAMPLE - Get children in specific class
function ClassChildrenList({ classId }: { classId: string }) {
  const { childOptions, loading } = useEntityOptions({ children: true });
  
  // Filter for specific class
  const classChildren = useMemo(() => 
    childOptions.filter(child => 
      child.metadata?.enrollment?.classId === classId
    ),
    [childOptions, classId]
  );
  
  if (loading) return <LoadingState />;
  
  return (
    <StudentProgressGrid 
      students={classChildren}
      onStudentPress={(child) => navigateToProfile(child.id)}
    />
  );
}`,
      alternativeForNonReact: `
// In API routes or utilities
const result = await DataService.getClassChildren(classId);
if (!result.success) throw new Error(result.error);
const children = result.data;`
    },

    enrollInClass: {
      method: "DataService.bulkEnrollChildren",
      usage: `
// ✅ COMPLETE EXAMPLE - Enroll children
function EnrollmentManager({ classId }: { classId: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleEnroll = async () => {
    setEnrolling(true);
    setError(null);
    
    try {
      const result = await DataService.bulkEnrollChildren(classId, selectedIds);
      
      // ALWAYS check success (Need #5)
      if (!result.success) {
        setError(result.error || 'Enrollment failed');
        return;
      }
      
      // Success handling
      showSuccessToast(\`Enrolled \${result.data.enrolled} children\`);
      setSelectedIds([]); // Clear selection
      
    } catch (err) {
      // ALWAYS handle exceptions (Need #5)
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEnrolling(false);
    }
  };
  
  return (
    <>
      {error && <Alert type="error">{error}</Alert>}
      <StudentSelector
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
      <SubmitButton 
        onClick={handleEnroll} 
        loading={enrolling}
        disabled={selectedIds.length === 0}
      >
        Enroll Selected
      </SubmitButton>
    </>
  );
}`
    }
  },

  // ============================================
  // PROGRESS TRACKING
  // ============================================
  progress: {
    trackIndividual: {
      hook: "useProgressTracking",
      usage: `
// ✅ COMPLETE EXAMPLE - Track individual child progress
import { useProgressTracking } from '@/hooks/use-progress-tracking';

function ProgressTracker({ childId, activityId }: Props) {
  const { createProgressRecord, loading, error } = useProgressTracking();
  const [score, setScore] = useState(4);
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async () => {
    const result = await createProgressRecord({
      child_id: childId,
      curriculum_item_id: activityId,
      execution_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      quality_score: score,
      engagement_level: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      teacher_notes: notes,
      parent_visible: true
    });
    
    if (result.success) {
      showSuccessToast('Progress recorded');
      setNotes(''); // Clear form
    } else {
      showErrorToast(result.error || 'Failed to save');
    }
  };
  
  return (
    <AutoForm
      schema={progressSchema}
      onSubmit={handleSubmit}
      loading={loading}
      footer={
        <FormControls.SubmitButton loading={loading}>
          Save Progress
        </FormControls.SubmitButton>
      }
    />
  );
}`,
      validation: `
// ALWAYS validate before saving
const isValid = score >= 1 && score <= 5 && childId && activityId;
if (!isValid) {
  showErrorToast('Please fill all required fields');
  return;
}`
    },

    trackClassProgress: {
      hook: "useTeacherDailyActivities",
      usage: `
// ✅ COMPLETE EXAMPLE - Mark entire class complete
function ClassActivityCard({ activity, classId }: Props) {
  const { markClassComplete, loading } = useTeacherDailyActivities(classId);
  const [marking, setMarking] = useState(false);
  
  const handleMarkComplete = async () => {
    setMarking(true);
    
    const result = await markClassComplete(activity.id, {
      participationLevel: 'full',
      engagementScore: 4,
      skillDemonstration: 'developing'
    });
    
    if (result.success) {
      // Activity list auto-refreshes
      showSuccessToast('Activity marked complete for all students');
    } else {
      showErrorToast('Failed to mark complete');
    }
    
    setMarking(false);
  };
  
  return (
    <TeacherActivityCard
      activity={activity}
      onActionPress={(action) => {
        if (action === 'complete') handleMarkComplete();
      }}
      actionLoading={marking}
    />
  );
}`
    },

    viewHistory: {
      hook: "useLearningTracking",
      usage: `
// ✅ COMPLETE EXAMPLE - View progress history
function ProgressHistory({ childId }: { childId: string }) {
  const { getChildLearningTrends, loading } = useLearningTracking();
  const [trends, setTrends] = useState<LearningTrends | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  
  useEffect(() => {
    getChildLearningTrends(childId, period)
      .then(setTrends)
      .catch(err => showErrorToast('Failed to load trends'));
  }, [childId, period]);
  
  if (loading || !trends) return <LoadingState />;
  
  return (
    <>
      <TabNavigation
        tabs={[
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' }
        ]}
        activeTab={period}
        onTabPress={setPeriod}
      />
      
      <StatCards stats={[
        { label: 'Activities', value: trends.totalActivities },
        { label: 'Completion', value: \`\${trends.completionRate}%\` },
        { label: 'Quality', value: trends.averageQuality.toFixed(1) }
      ]} />
      
      <ProgressChart data={trends} />
    </>
  );
}`
    }
  },

  // ============================================
  // DAILY ACTIVITIES & SCHEDULE
  // ============================================
  activities: {
    getTodaySchedule: {
      hook: "useTeacherDailyActivities",
      usage: `
// ✅ COMPLETE EXAMPLE - Teacher daily view
function TeacherDashboard({ classId }: { classId: string }) {
  const { 
    activities, 
    loading, 
    error,
    activitySummary,
    markClassComplete,
    markIndividualComplete
  } = useTeacherDailyActivities(classId);
  
  // Handle all states properly
  if (loading) return <LoadingState message="Loading today's activities..." />;
  if (error) return <ErrorState error={error} />;
  if (!activities.length) return <EmptyState title="No activities scheduled today" />;
  
  return (
    <ScrollableContainer>
      {/* Summary cards */}
      <StatCards stats={[
        { label: 'Total', value: activitySummary.total },
        { label: 'Completed', value: activitySummary.completed },
        { label: 'In Progress', value: activitySummary.inProgress },
        { label: 'Completion', value: \`\${activitySummary.completionRate}%\` }
      ]} />
      
      {/* Activity list */}
      <DailyActivityCalendar
        activities={activities}
        onActivityPress={async (activity) => {
          // Handle activity actions
          const result = await markClassComplete(activity.id);
          if (!result.success) {
            showErrorToast('Failed to update activity');
          }
        }}
      />
    </ScrollableContainer>
  );
}`,
      autoRefresh: "Activities auto-refresh when marked complete"
    },

    addQuickNote: {
      hook: "useTeacherDailyActivities",
      usage: `
// ✅ COMPLETE EXAMPLE - Add observation note
function QuickNotePanel({ activityId, childId }: Props) {
  const { addQuickNote } = useTeacherDailyActivities(classId);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    if (!note.trim()) {
      showErrorToast('Please enter a note');
      return;
    }
    
    setSaving(true);
    const result = await addQuickNote(activityId, childId, note);
    
    if (result.success) {
      setNote('');
      showSuccessToast('Note saved');
    } else {
      showErrorToast('Failed to save note');
    }
    setSaving(false);
  };
  
  return (
    <QuickObservationPanel
      value={note}
      onChange={setNote}
      onSave={handleSave}
      saving={saving}
      placeholder="Add observation..."
    />
  );
}`
    }
  },

  // ============================================
  // K-MAP ANALYTICS
  // ============================================
  kmap: {
    calculate: {
      hook: "useKMapAnalytics",
      usage: `
// ✅ COMPLETE EXAMPLE - K-Map visualization
function KMapDashboard({ childId }: { childId: string }) {
  const { calculateChildKMap, loading, error } = useKMapAnalytics();
  const [analysis, setAnalysis] = useState<KMapAnalysis | null>(null);
  
  useEffect(() => {
    calculateChildKMap(childId)
      .then(data => {
        if (data) setAnalysis(data);
        else showErrorToast('No K-Map data available');
      })
      .catch(err => showErrorToast('Failed to load K-Map'));
  }, [childId]);
  
  if (loading) return <LoadingState />;
  if (!analysis) return <EmptyState title="No K-Map data yet" />;
  
  return (
    <div>
      {/* Visual chart */}
      <KMapRadarChart 
        scores={analysis.current}
        showBalance
        animated
      />
      
      {/* Score pills */}
      <ProgressPills dimensions={analysis.current} />
      
      {/* Gaps and recommendations */}
      {analysis.gaps.map(gap => (
        <Alert key={gap.dimension} type="info">
          <strong>{gap.dimension}:</strong> {gap.deficit} points below target
        </Alert>
      ))}
      
      {/* Recommended activities */}
      <h3>Recommended Activities</h3>
      {analysis.recommendations.map(rec => (
        <LearningActivityCard
          key={rec.activityId}
          activity={rec}
          variant="recommendation"
        />
      ))}
    </div>
  );
}`,
      nullSafety: `
// ALWAYS use null safety (Need #10)
const moveScore = analysis?.current?.move ?? 0;
const thinkScore = analysis?.current?.think ?? 0;
const endureScore = analysis?.current?.endure ?? 0;`
    },

    compareToClass: {
      hook: "useKMapAnalytics",
      usage: `
// ✅ COMPLETE EXAMPLE - Compare child to class average
function KMapComparison({ childId, classId }: Props) {
  const { compareToClassAverage } = useKMapAnalytics();
  const [comparison, setComparison] = useState<any>(null);
  
  useEffect(() => {
    compareToClassAverage(childId, classId)
      .then(setComparison)
      .catch(console.error);
  }, [childId, classId]);
  
  if (!comparison) return <LoadingState />;
  
  return (
    <div>
      <h3>Performance vs Class Average</h3>
      {Object.entries(comparison.comparison).map(([dimension, diff]) => (
        <div key={dimension}>
          <span>{dimension}: </span>
          <span className={diff > 0 ? 'text-green' : 'text-red'}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}`
    }
  },

  // ============================================
  // ATTACHMENTS & MEDIA
  // ============================================
  media: {
    upload: {
      hook: "useAttachments",
      usage: `
// ✅ COMPLETE EXAMPLE - Photo upload with progress
function PhotoUpload({ activityId, childIds }: Props) {
  const { uploadMultipleAttachments, loading } = useAttachments();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleUpload = async () => {
    if (!files.length) {
      showErrorToast('Please select files');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    
    try {
      // Prepare attachment data
      const attachments = files.map(file => ({
        activity_schedule_id: activityId,
        attachment_type: 'photo' as const,
        file_url: URL.createObjectURL(file), // In real app, upload to storage first
        caption: '',
        tags: childIds,
        parent_visible: true
      }));
      
      // Upload with progress tracking
      for (let i = 0; i < attachments.length; i++) {
        await uploadAttachment(attachments[i]);
        setProgress(((i + 1) / attachments.length) * 100);
      }
      
      showSuccessToast(\`Uploaded \${files.length} photos\`);
      setFiles([]);
      
    } catch (error) {
      showErrorToast('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  return (
    <MediaUpload
      accept="image/*"
      multiple
      onFilesSelected={setFiles}
      files={files}
      uploading={uploading}
      progress={progress}
      onUpload={handleUpload}
    />
  );
}`
    },

    gallery: {
      hook: "useAttachments",
      usage: `
// ✅ COMPLETE EXAMPLE - Child photo gallery
function PhotoGallery({ childId }: { childId: string }) {
  const { getMediaTimeline, loading } = useAttachments();
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent'>('recent');
  
  useEffect(() => {
    getMediaTimeline(childId, {
      limit: filter === 'recent' ? 20 : undefined,
      mediaType: 'photo'
    })
    .then(setPhotos)
    .catch(err => showErrorToast('Failed to load photos'));
  }, [childId, filter]);
  
  if (loading) return <LoadingState />;
  if (!photos.length) return <EmptyState title="No photos yet" />;
  
  return (
    <>
      <ChipSelector
        options={[
          { value: 'recent', label: 'Recent' },
          { value: 'all', label: 'All Photos' }
        ]}
        value={filter}
        onChange={setFilter}
      />
      
      <MediaGallery
        items={photos}
        onItemPress={(photo) => openPhotoViewer(photo)}
        columns={3}
      />
    </>
  );
}`
    }
  },

  // ============================================
  // PARENT VIEWS
  // ============================================
  parentViews: {
    getChildren: {
      hook: "useParentView",
      usage: `
// ✅ COMPLETE EXAMPLE - Parent dashboard
function ParentDashboard() {
  const { user } = useAuth();
  const { children, selectedChildId, setSelectedChildId, loading } = useParentView(user?.id);
  
  if (loading) return <LoadingState />;
  if (!children.length) return <EmptyState title="No children linked to your account" />;
  
  return (
    <>
      {/* Child selector */}
      <TabNavigation
        tabs={children.map(child => ({
          key: child.id,
          label: child.firstName
        }))}
        activeTab={selectedChildId}
        onTabPress={setSelectedChildId}
      />
      
      {/* Selected child view */}
      {selectedChildId && (
        <ChildDashboard childId={selectedChildId} />
      )}
    </>
  );
}`
    },

    dailyUpdate: {
      hook: "useParentView",
      usage: `
// ✅ COMPLETE EXAMPLE - Daily summary for parents
function DailySummary({ childId }: { childId: string }) {
  const { getChildDailyUpdate } = useParentView(parentId);
  const [date, setDate] = useState(new Date());
  const [update, setUpdate] = useState<DailyUpdateForParent | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    getChildDailyUpdate(childId, date.toISOString().split('T')[0])
      .then(data => {
        setUpdate(data);
        setLoading(false);
      })
      .catch(err => {
        showErrorToast('Failed to load daily update');
        setLoading(false);
      });
  }, [childId, date]);
  
  if (loading) return <LoadingState />;
  if (!update) return <EmptyState title="No update for this day" />;
  
  return (
    <ScrollableContainer>
      {/* Date picker */}
      <DatePicker value={date} onChange={setDate} maxDate={new Date()} />
      
      {/* Attendance */}
      <Card>
        <h3>Attendance</h3>
        <p>Status: {update.attendance.status}</p>
        {update.attendance.arrivalTime && (
          <p>Arrived: {formatTime(update.attendance.arrivalTime)}</p>
        )}
      </Card>
      
      {/* Activities */}
      <Card>
        <h3>Activities</h3>
        {update.activities.map((activity, i) => (
          <div key={i}>
            <span>{activity.title}</span>
            <span>{activity.completed ? '✓' : '○'}</span>
          </div>
        ))}
      </Card>
      
      {/* Photos */}
      {update.photos.length > 0 && (
        <MediaGallery items={update.photos} />
      )}
    </ScrollableContainer>
  );
}`
    }
  },

  // ============================================
  // ATTENDANCE
  // ============================================
  attendance: {
    bulkUpdate: {
      method: "DataService.bulkUpdateAttendance",
      usage: `
// ✅ COMPLETE EXAMPLE - Attendance marking
function AttendanceSheet({ classId, date }: Props) {
  const { childOptions } = useEntityOptions({ children: true });
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  
  // Filter for class children
  const classChildren = childOptions.filter(
    child => child.metadata?.enrollment?.classId === classId
  );
  
  const handleSave = async () => {
    setSaving(true);
    
    const updates = Object.entries(attendance).map(([childId, status]) => ({
      child_id: childId,
      date: date,
      status: status,
      check_in_time: status === 'present' ? new Date().toISOString() : undefined,
      class_id: classId
    }));
    
    const result = await DataService.bulkUpdateAttendance(updates);
    
    if (result.success) {
      showSuccessToast('Attendance saved');
    } else {
      showErrorToast('Failed to save attendance');
    }
    setSaving(false);
  };
  
  return (
    <>
      {classChildren.map(child => (
        <div key={child.id}>
          <span>{child.label}</span>
          <ChipSelector
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' }
            ]}
            value={attendance[child.id] || 'absent'}
            onChange={(status) => setAttendance(prev => ({
              ...prev,
              [child.id]: status
            }))}
          />
        </div>
      ))}
      
      <SubmitButton onClick={handleSave} loading={saving}>
        Save Attendance
      </SubmitButton>
    </>
  );
}`
    }
  }
};

/**
 * SECTION 3: ERROR HANDLING PATTERNS (Need #5)
 * ===========================================
 */
export const ErrorPatterns = {
  alwaysCheckSuccess: `
// ✅ ALWAYS check result.success
const result = await someOperation();
if (!result.success) {
  console.error('Operation failed:', result.error);
  showErrorToast(result.error || 'Operation failed');
  return;
}
// Now safe to use result.data`,

  handleAsyncErrors: `
// ✅ ALWAYS wrap async operations
try {
  const data = await someAsyncOperation();
  // handle success
} catch (error) {
  console.error('Error:', error);
  showErrorToast(error instanceof Error ? error.message : 'Unknown error');
} finally {
  setLoading(false);
}`,

  nullSafety: `
// ✅ ALWAYS use optional chaining (Need #10)
const firstName = child?.firstName ?? 'Unknown';
const className = child?.enrollment?.className ?? 'Not enrolled';
const kmapScore = analysis?.current?.move ?? 0;

// ❌ NEVER access nested properties directly
const name = child.enrollment.className; // Can crash!`,

  emptyArrays: `
// ✅ ALWAYS check for empty arrays
if (!items || items.length === 0) {
  return <EmptyState title="No items found" />;
}

// ❌ NEVER assume arrays have data
const firstItem = items[0]; // Can be undefined!`,

  loadingStates: `
// ✅ ALWAYS handle all states (Need #7)
if (loading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
if (!data) return <EmptyState />;

// Only now is it safe to render data
return <DataView data={data} />;`
};

/**
 * SECTION 4: COMMON MISTAKES TO AVOID (Need #8)
 * ============================================
 */
export const CommonMistakes = {
  wrongDataAccess: {
    wrong: `
// ❌ Using DataService in components
function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    DataService.getClassChildren(classId).then(result => {
      setData(result.data);
    });
  }, []);
  
  // No loading state, no error handling!
}`,
    correct: `
// ✅ Using hooks in components
function MyComponent() {
  const { childOptions, loading, error } = useEntityOptions({ children: true });
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  // Automatic state management!
}`
  },

  directDbCalls: {
    wrong: `
// ❌ Direct Supabase calls in components
const { data } = await db.supabase.from('children').select();`,
    correct: `
// ✅ Use hooks instead
const { childOptions } = useEntityOptions({ children: true });`
  },

  forgettingTypes: {
    wrong: `
// ❌ Using 'any' or no types
const [child, setChild] = useState(null);
const handleSave = (data: any) => { ... }`,
    correct: `
// ✅ Always use proper types
const [child, setChild] = useState<Child | null>(null);
const handleSave = (data: ProgressRecord) => { ... }`
  },

  notCheckingAuth: {
    wrong: `
// ❌ Assuming user is logged in
function Dashboard() {
  const user = getUser(); // Could be null!
  return <div>Welcome {user.name}</div>;
}`,
    correct: `
// ✅ Always check auth state
function Dashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" />;
  
  return <div>Welcome {user.email}</div>;
}`
  }
};

/**
 * SECTION 5: QUICK LOOKUP TABLE
 * =============================
 */
export const QuickLookup = {
  "I need children list": "useEntityOptions({ children: true })",
  "I need today's activities": "useTeacherDailyActivities(classId)",
  "I need to track progress": "useProgressTracking()",
  "I need to upload photos": "useAttachments()",
  "I need K-Map scores": "useKMapAnalytics()",
  "I need parent's children": "useParentView(parentId)",
  "I need to mark attendance": "DataService.bulkUpdateAttendance()",
  "I need curriculum items": "useCurriculumManagement()",
  "I need milestones": "useMilestoneTracking()",
  "I need to add notes": "useLearningTracking()"
};

/**
 * SECTION 6: COMPLETE COMPONENT TEMPLATE
 * =====================================
 */
export const ComponentTemplate = `
// ✅ COMPLETE COMPONENT TEMPLATE - Copy and modify
import React, { useState, useEffect } from 'react';
import { useRequiredHook } from '@/hooks/use-required-hook';
import { LoadingState, ErrorState, EmptyState } from '@/app/components/shared/empty-state';
import type { RequiredType } from '@/app/components/shared/types/data-service.types';

interface Props {
  requiredProp: string;
  optionalProp?: number;
}

export function MyComponent({ requiredProp, optionalProp = 0 }: Props) {
  // State
  const [localState, setLocalState] = useState<RequiredType | null>(null);
  
  // Hooks
  const { data, loading, error, refresh } = useRequiredHook(requiredProp);
  
  // Effects
  useEffect(() => {
    // Effect logic here
  }, [requiredProp]);
  
  // Handlers
  const handleAction = async () => {
    try {
      // Action logic
    } catch (error) {
      console.error('Action failed:', error);
      showErrorToast('Action failed');
    }
  };
  
  // Render states
  if (loading) return <LoadingState message="Loading..." />;
  if (error) return <ErrorState error={error} retry={refresh} />;
  if (!data) return <EmptyState title="No data available" />;
  
  // Main render
  return (
    <ScrollableContainer>
      {/* Your UI here */}
    </ScrollableContainer>
  );
}`;