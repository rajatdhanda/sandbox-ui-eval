// app/components/shared/types/data-service.types.ts
// Path: app/components/shared/types/data-service.types.ts

/**
 * DATA SERVICE TYPE DEFINITIONS
 * 
 * This file contains all TypeScript interfaces used throughout the application.
 * Import these types instead of using 'any' to ensure type safety.
 * 
 * Usage:
 * import { Child, EnrichedClassData, ServiceResponse } from '@/app/components/shared/types/data-service.types';
 */

// ============================================
// BASE TYPES
// ============================================

/**
 * Standard response wrapper for all service methods
 * @template T The type of data being returned
 */


/**
 * MIGRATION GUIDE - IMPORTANT!
 * ===========================
 * 
 * DataService has been moved to prevent misuse in React components.
 * 
 * OLD LOCATION (REMOVED):
 * ❌ import { DataService } from '@/app/components/shared/data-service';
 * ❌ import { DataService } from '../shared/data-service';
 * 
 * NEW LOCATION (SERVER ONLY):
 * ✅ import { ServerDataService } from '@/lib/services/server-data-service';
 * 
 * IMPORTANT RULES:
 * 1. In React Components: NEVER use ServerDataService - use hooks instead
 * 2. In API Routes: Use ServerDataService
 * 3. In Tests: Use ServerDataService
 * 
 * IF YOU SEE THIS ERROR:
 * "Unable to resolve module @/app/components/shared/data-service"
 * 
 * FIX:
 * 1. Remove the DataService import
 * 2. Use the appropriate hook from @/hooks/*
 * 3. See data-service-reference.tsx for which hook to use
 * 
 * COMMON REPLACEMENTS:
 * - DataService.getClassChildren() → useEntityOptions({ children: true })
 * - DataService.getEnrichedChildData() → useEntityOptions() + useKMapAnalytics()
 * - DataService.markClassActivityComplete() → useTeacherDailyActivities().markClassComplete()
 * - DataService.bulkUpdateAttendance() → No hook, use ServerDataService in API only
 * 
 * @deprecated DataService in components - use hooks instead
 */

// Type to prevent accidental imports (this will cause TypeScript errors if used)
export type DO_NOT_IMPORT_DATASERVICE_USE_HOOKS_INSTEAD = never;


export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: Error | string | null;
  metadata?: Record<string, any>;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard list response with pagination
 */
export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  pagination?: PaginationMeta;
}

// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  profilePhoto?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherUser extends AuthUser {
  role: 'teacher';
  classId?: string;
  className?: string;
  specializations?: string[];
  yearsOfExperience?: number;
}

export interface ParentUser extends AuthUser {
  role: 'parent';
  childrenIds: string[];
  emergencyContact?: boolean;
  relationshipType?: 'mother' | 'father' | 'guardian' | 'other';
}

export interface UserProfile {
  user: AuthUser;
  permissions: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
}

// ============================================
// CHILD & ENROLLMENT TYPES
// ============================================

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string;
  medicalNotes?: string;
  allergies?: string[];
  emergencyContacts?: EmergencyContact[];
  isActive: boolean;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface ChildWithEnrollment extends Child {
  enrollment?: {
    classId: string;
    className: string;
    status: EnrollmentStatus;
    enrollmentDate: string;
    withdrawalDate?: string;
  };
}

export type EnrollmentStatus = 'enrolled' | 'pending' | 'withdrawn' | 'graduated';

export interface ChildClassAssignment {
  id: string;
  childId: string;
  classId: string;
  enrollmentDate: string;
  withdrawalDate?: string;
  status: EnrollmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CLASS & SCHOOL TYPES
// ============================================

export interface Class {
  id: string;
  name: string;
  ageGroup: '0-1' | '1-2' | '2-3' | '3-4' | '4-5' | '5-6';
  capacity: number;
  currentEnrollment?: number;
  roomNumber?: string;
  isActive: boolean;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassWithRelations extends Class {
  teachers: TeacherAssignment[];
  children: ChildWithEnrollment[];
  schedule?: WeeklySchedule;
}

export interface TeacherAssignment {
  teacherId: string;
  teacherName: string;
  role: 'primary' | 'assistant' | 'substitute';
  assignedDate: string;
  isActive: boolean;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
}

export interface DaySchedule {
  activities: ScheduledActivity[];
  meals: ScheduledMeal[];
}

// ============================================
// ATTENDANCE TYPES
// ============================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  childId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  childId: string;
  period: 'week' | 'month' | 'term';
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

// ============================================
// CURRICULUM & ACTIVITY TYPES
// ============================================

export type ActivityType = 'physical' | 'cognitive' | 'social' | 'creative' | 'routine' | 'outdoor' | 'quiet';
export type ActivityStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CurriculumItem {
  id: string;
  title: string;
  description?: string;
  activityType: ActivityType;
  ageGroups: string[];
  durationMinutes: number;
  materials?: string[];
  instructions?: string;
  learningObjectives?: string[];
  kmapDimensions: KMapDimensions;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KMapDimensions {
  move: number;  // 0-100 weight
  think: number; // 0-100 weight
  endure: number; // 0-100 weight
}

export interface ActivitySchedule {
  id: string;
  curriculumItemId: string;
  classId: string;
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  status: ActivityStatus;
  teacherId?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledActivity extends ActivitySchedule {
  curriculumItem: CurriculumItem;
  assignedTeacher?: {
    id: string;
    name: string;
  };
}

export interface ActivityWithProgress extends ScheduledActivity {
  progress: {
    total: number;
    completed: number;
    percentage: number;
    childProgress: ChildActivityProgress[];
  };
}

export interface ChildActivityProgress {
  childId: string;
  childName: string;
  status: ProgressStatus;
  qualityScore?: number;
  engagementLevel?: EngagementLevel;
  notes?: string;
}

// ============================================
// PROGRESS TRACKING TYPES
// ============================================

export type ProgressStatus = 'scheduled' | 'completed' | 'partial' | 'skipped' | 'absent';
export type EngagementLevel = 'low' | 'medium' | 'high';
export type ExecutionType = 'class' | 'individual';

export interface ProgressRecord {
  id: string;
  childId: string;
  curriculumItemId: string;
  classId?: string;
  executionDate: string;
  executionType: ExecutionType;
  status: ProgressStatus;
  qualityScore?: number; // 1-5
  engagementLevel?: EngagementLevel;
  teacherNotes?: string;
  kmapScores?: KMapScores;
  durationMinutes?: number;
  parentVisible: boolean;
  attachments?: string[]; // attachment IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  childId: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  averageQualityScore: number;
  averageEngagement: number;
  kmapProgress: KMapScores;
  strengths: string[];
  areasForImprovement: string[];
  teacherComments?: string;
}

// ============================================
// K-MAP ANALYTICS TYPES
// ============================================

export interface KMapScores {
  move: number;   // 0-10
  think: number;  // 0-10
  endure: number; // 0-10
}

export interface KMapProfile {
  id: string;
  childId: string;
  assessmentDate: string;
  scores: KMapScores;
  overallScore: number;
  ageInMonths: number;
  assessedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KMapAnalysis {
  childId: string;
  current: KMapScores;
  previous?: KMapScores;
  average: KMapScores;
  percentile?: {
    move: number;
    think: number;
    endure: number;
  };
  trends: KMapTrends;
  gaps: KMapGap[];
  strengths: KMapStrength[];
  recommendations: ActivityRecommendation[];
  lastUpdated: string;
}

export interface KMapTrends {
  move: TrendPoint[];
  think: TrendPoint[];
  endure: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  value: number;
  activityCount?: number;
}

export interface KMapGap {
  dimension: keyof KMapScores;
  currentScore: number;
  targetScore: number;
  deficit: number;
  priority: 'high' | 'medium' | 'low';
}

export interface KMapStrength {
  dimension: keyof KMapScores;
  score: number;
  percentile: number;
  description: string;
}

export interface ActivityRecommendation {
  activityId: string;
  title: string;
  activityType: ActivityType;
  targetDimension: keyof KMapScores;
  expectedImprovement: number;
  rationale: string;
  priority: number; // 1-10
  estimatedDuration: number;
}

// ============================================
// MILESTONE TYPES
// ============================================

export type MilestoneCategory = 'physical' | 'cognitive' | 'social' | 'emotional' | 'language' | 'self-care';
export type MilestoneStatus = 'not_assessed' | 'emerging' | 'progressing' | 'achieved';

export interface MilestoneDefinition {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  ageRangeMonths: {
    min: number;
    max: number;
  };
  indicators: string[];
  dimensionWeights: KMapDimensions;
  isActive: boolean;
  sequence?: number;
  prerequisiteMilestoneIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChildMilestone {
  id: string;
  childId: string;
  milestoneDefinitionId: string;
  status: MilestoneStatus;
  achievementDate?: string;
  achievementAgeMonths?: number;
  evidenceType?: 'observation' | 'photo' | 'video' | 'assessment';
  evidenceUrl?: string;
  notes?: string;
  assessedBy: string;
  assessmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneWithDefinition extends ChildMilestone {
  definition: MilestoneDefinition;
}

export interface MilestoneProgress {
  childId: string;
  category: MilestoneCategory;
  total: number;
  achieved: number;
  progressing: number;
  emerging: number;
  notAssessed: number;
  achievementRate: number;
  milestones: MilestoneWithDefinition[];
}

// ============================================
// OBSERVATION & NOTES TYPES
// ============================================

export type ObservationType = 'behavioral' | 'social' | 'emotional' | 'academic' | 'health' | 'general';

export interface Observation {
  id: string;
  childId: string;
  observationType: ObservationType;
  description: string;
  context?: string;
  tags?: string[];
  kmapDimensions?: Partial<KMapScores>;
  attachments?: string[];
  parentVisible: boolean;
  followUpRequired: boolean;
  observedBy: string;
  observationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickNote {
  id: string;
  childId: string;
  activityId?: string;
  note: string;
  type: 'positive' | 'concern' | 'neutral';
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
}

// ============================================
// MEDIA & ATTACHMENT TYPES
// ============================================

export type MediaType = 'photo' | 'video' | 'document' | 'audio';
export type AttachmentContext = 'activity' | 'progress' | 'observation' | 'milestone' | 'general';

export interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  context: AttachmentContext;
  contextId?: string; // ID of related entity
  childId?: string;
  classId?: string;
  caption?: string;
  tags?: string[];
  isParentVisible: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaGalleryItem extends Attachment {
  activity?: {
    id: string;
    title: string;
    date: string;
  };
  children?: Array<{
    id: string;
    name: string;
  }>;
}

// ============================================
// MEAL & NUTRITION TYPES
// ============================================

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';
export type ConsumptionLevel = 'none' | 'some' | 'most' | 'all';

export interface MealPlan {
  id: string;
  date: string;
  mealType: MealType;
  menuItems: MenuItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'main' | 'side' | 'fruit' | 'vegetable' | 'dairy' | 'beverage';
  allergens?: string[];
  nutritionInfo?: NutritionInfo;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface MealRecord {
  id: string;
  childId: string;
  mealPlanId: string;
  date: string;
  mealType: MealType;
  consumption: ConsumptionLevel;
  itemsConsumed?: string[];
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMeal {
  time: string;
  mealType: MealType;
  menuItems: string[];
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'milestone_achieved' 
  | 'progress_update' 
  | 'attendance_alert'
  | 'activity_reminder'
  | 'observation_added'
  | 'message'
  | 'announcement'
  | 'emergency';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, any>; // Type-specific data
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  email: NotificationChannelPrefs;
  push: NotificationChannelPrefs;
  sms: NotificationChannelPrefs;
}

export interface NotificationChannelPrefs {
  enabled: boolean;
  types: NotificationType[];
  quietHours?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

// ============================================
// ENRICHED/COMPOSITE TYPES
// ============================================

export interface EnrichedChild {
  // Basic info
  child: Child;
  
  // Current enrollment
  enrollment?: {
    classId: string;
    className: string;
    teachers: string[];
    classSize: number;
  };
  
  // Today's data
  todayAttendance?: AttendanceRecord;
  todayActivities: ActivityWithProgress[];
  todayProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  
  // K-Map analysis
  kmapAnalysis?: KMapAnalysis;
  
  // Recent data
  recentObservations: Observation[];
  recentMilestones: MilestoneWithDefinition[];
  recentPhotos: Attachment[];
  
  // Analytics
  weeklyAttendanceRate: number;
  monthlyProgressRate: number;
  strengths: string[];
  concernAreas: string[];
  
  // Recommendations
  recommendedActivities: ActivityRecommendation[];
  upcomingMilestones: MilestoneDefinition[];
}

export interface EnrichedClassData {
  // Class info
  class: ClassWithRelations;
  
  // Children with full data
  children: EnrichedChild[];
  
  // Today's schedule
  todayActivities: ActivityWithProgress[];
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  };
  
  // Analytics
  summary: ClassSummary;
  kmapAverages: KMapScores;
  progressTrends: TrendPoint[];
  
  // Alerts
  alerts: ClassAlert[];
}

export interface ClassSummary {
  totalChildren: number;
  presentChildren: number;
  totalActivities: number;
  completedActivities: number;
  averageProgress: number;
  averageEngagement: EngagementLevel;
  classKMapAverage: KMapScores;
  topPerformers: Array<{
    childId: string;
    name: string;
    score: number;
  }>;
  needsAttention: Array<{
    childId: string;
    name: string;
    reason: string;
  }>;
}

export interface ClassAlert {
  type: 'attendance' | 'progress' | 'behavior' | 'health';
  severity: 'info' | 'warning' | 'error';
  message: string;
  childId?: string;
  actionRequired?: boolean;
}

// ============================================
// PARENT VIEW TYPES
// ============================================

export interface ParentDashboard {
  parent: ParentUser;
  children: ParentChildView[];
  announcements: Announcement[];
  upcomingEvents: Event[];
  unreadNotifications: number;
}

export interface ParentChildView {
  child: Child;
  todaySummary: DailyUpdateForParent;
  weeklyProgress: WeeklyProgressSummary;
  recentPhotos: Attachment[];
  upcomingActivities: ScheduledActivity[];
  messages: Message[];
}

export interface DailyUpdateForParent {
  date: string;
  attendance: {
    status: AttendanceStatus;
    arrivalTime?: string;
    departureTime?: string;
  };
  activities: Array<{
    title: string;
    type: ActivityType;
    completed: boolean;
    notes?: string;
  }>;
  meals: Array<{
    mealType: MealType;
    consumption: ConsumptionLevel;
  }>;
  mood: 'happy' | 'neutral' | 'upset' | 'tired';
  highlights: string[];
  photos: Attachment[];
  teacherNote?: string;
}

export interface WeeklyProgressSummary {
  weekStarting: string;
  attendanceDays: number;
  activitiesCompleted: number;
  kmapProgress: {
    current: KMapScores;
    change: KMapScores; // Can be negative
  };
  milestonesAchieved: string[];
  areasOfGrowth: string[];
}

// ============================================
// COMMUNICATION TYPES
// ============================================

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  childId?: string; // If message is about specific child
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'class' | 'urgent';
  targetAudience: UserRole[];
  classIds?: string[]; // If class-specific
  validFrom: string;
  validUntil: string;
  createdBy: string;
  attachments?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'school' | 'class' | 'activity' | 'holiday';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  classIds?: string[];
  isAllDay: boolean;
  isMandatory: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface SearchFilters {
  query?: string;
  entity?: 'child' | 'activity' | 'milestone' | 'observation';
  dateRange?: DateRange;
  classes?: string[];
  ageGroups?: string[];
  activityTypes?: ActivityType[];
  tags?: string[];
  status?: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SearchResults<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets?: SearchFacets;
}

export interface SearchFacets {
  classes: FacetValue[];
  ageGroups: FacetValue[];
  activityTypes: FacetValue[];
  tags: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  label?: string;
}

// ============================================
// SYSTEM & UTILITY TYPES
// ============================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: ServiceStatus;
    storage: ServiceStatus;
    authentication: ServiceStatus;
    notifications: ServiceStatus;
  };
  lastChecked: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

export interface ExportData {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  entity: string;
  filters?: SearchFilters;
  fields?: string[];
  includeRelations?: boolean;
  generatedAt: string;
  generatedBy: string;
  downloadUrl?: string;
}

// ============================================
// ERROR TYPES
// ============================================

export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
  userMessage?: string;
  timestamp: string;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  fields: Record<string, string[]>;
}

export interface ApiError extends AppError {
  code: 'API_ERROR';
  endpoint?: string;
  method?: string;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: FieldValidation;
  dependsOn?: string;
  visible?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: any) => string | null;
}

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string[];
}


// ============================================
// OBSERVATION TYPES
// ============================================

export interface ObservationData {
  id?: string;
  type: 'behavioral' | 'academic' | 'social' | 'physical' | 'creative';
  description: string;
  tags: string[];
  parentVisible: boolean;
  kmapDimensions?: ('move' | 'think' | 'endure')[];
  timestamp?: string;
  selectedStudentIds?: string[];
  mediaUrls?: string[];
  voiceNoteUrl?: string;
}

export interface ObservationContext {
  level: 'class-activity' | 'class' | 'individual';
  activityId?: string;
  studentIds: string[];
  previousObservationId?: string;
  batchId?: string;
}

export interface ObservationTemplate {
  id: string;
  name: string;
  type: ObservationData['type'];
  templateText: string;
  tags: string[];
  isActive: boolean;
}

export interface ObservationBatch {
  id: string;
  context: ObservationContext;
  observations: ObservationData[];
  createdAt: string;
  createdBy: string;
}

export interface ProgressTrackingObservation {
  id: string;
  child_id: string;
  activity_schedule_id?: string;
  teacher_id: string;
  teacher_notes: string;
  observation_type: ObservationData['type'];
  parent_visible: boolean;
  execution_date: string;
  created_at: string;
  updated_at?: string;
  // Relations
  children?: Child;
  activity_schedule?: ActivitySchedule;
}


export interface AnalysisOptions {
  focusAreas?: string[];
  includeRecommendations?: boolean;
  compareToClassAverage?: boolean;
}

