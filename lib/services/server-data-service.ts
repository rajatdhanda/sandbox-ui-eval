// lib/services/server-data-service.ts
// Path: lib/services/server-data-service.ts

/**
 * DATA SERVICE - Server-Side Data Access Layer
 * ===========================================
 * 
 * ⚠️ CRITICAL: This service is for NON-REACT contexts only!
 * 
 * In React components, ALWAYS use hooks instead:
 * @see app/components/shared/types/data-service-reference.tsx
 * 
 * Use DataService only in:
 * ✅ API routes (app/api/*)
 * ✅ Server actions
 * ✅ Testing files
 * ✅ Background jobs/scripts
 * ✅ Server-side data fetching
 * 
 * ❌ NEVER use in React components - use hooks!
 */

import { db } from '@/lib/supabase/services/database.service';
import type {
  ServiceResponse,
  AuthUser,
  Child,
  ChildWithEnrollment,
  EnrichedChild,
  EnrichedClassData,
  AttendanceRecord,
  AttendanceStatus,
  ProgressRecord,
  ProgressStatus,
  EngagementLevel,
  ActivitySchedule,
  ActivityWithProgress,
  KMapScores,
  KMapProfile,
  KMapAnalysis,
  CurriculumItem,
  Attachment,
  ChildMilestone,
  ClassSummary,
  DailyUpdateForParent,
  MealRecord,
  Notification,
  ActivityRecommendation,
  TrendPoint,
  MilestoneWithDefinition,
  Observation,
  QuickNote,
  UserRole,
  EnrollmentStatus
} from './types/data-service.types';

// ============================================
// DEVELOPMENT HELPERS
// ============================================

const isDevelopment = process.env.NODE_ENV === 'development';
const enableDebugLogs = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

/**
 * Development warning when DataService is used incorrectly
 */
function warnIfReactComponent(methodName: string): void {
  if (isDevelopment && typeof window !== 'undefined') {
    const stack = new Error().stack || '';
    
    // Check if called from a React component
    if (stack.includes('use') || stack.includes('Component') || stack.includes('.tsx')) {
      console.warn(
        `⚠️ DataService.${methodName} called from React component!\n` +
        `📍 Use hooks instead - see data-service-reference.tsx\n` +
        `📍 Stack: ${stack.split('\n')[3]?.trim()}`
      );
    }
  }
}

/**
 * Debug logger for development
 */
function debugLog(method: string, params: Record<string, any>, result?: any): void {
  if (enableDebugLogs) {
    console.log(`[DataService.${method}]`, {
      params,
      result: result?.success ? 'SUCCESS' : 'FAILED',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Enhanced error with helpful context
 */
function createError(
  message: string, 
  method: string, 
  suggestion?: string,
  originalError?: any
): Error {
  const error = new Error(
    `${message}\n` +
    `Method: DataService.${method}\n` +
    (suggestion ? `💡 Suggestion: ${suggestion}\n` : '') +
    (originalError ? `Original: ${originalError.message || originalError}` : '')
  );
  
  // Add custom properties for better error tracking
  (error as any).method = method;
  (error as any).service = 'DataService';
  (error as any).timestamp = new Date().toISOString();
  
  return error;
}

// ============================================
// DATA SERVICE CLASS
// ============================================

export class DataService {
  
  // ============================================
  // VALIDATION HELPERS
  // ============================================
  
  private static validateUUID(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw createError(
        `Invalid ${fieldName}: ${id}`,
        'validateUUID',
        'Ensure you\'re passing a valid UUID from the database'
      );
    }
  }

  private static validateDate(date: string, fieldName: string = 'date'): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      throw createError(
        `Invalid ${fieldName}: ${date}`,
        'validateDate',
        'Use format YYYY-MM-DD'
      );
    }
  }

  private static validateQualityScore(score: number): void {
    if (!score || score < 1 || score > 5) {
      throw createError(
        `Invalid quality score: ${score}`,
        'validateQualityScore',
        'Score must be between 1 and 5'
      );
    }
  }

  private static validateArray<T>(arr: T[], fieldName: string): void {
    if (!Array.isArray(arr)) {
      throw createError(
        `${fieldName} must be an array`,
        'validateArray',
        `Ensure you're passing an array of ${fieldName}`
      );
    }
  }

  // ============================================
  // SECTION 1: AUTHENTICATION
  // 🎣 Hook Alternative: useAuth()
  // ============================================
  
  /**
   * Get current authenticated user
   * @deprecated in React components - use useAuth() hook
   * @returns Typed user object or null
   */
  static async getCurrentUser(): Promise<ServiceResponse<AuthUser | null>> {
    warnIfReactComponent('getCurrentUser');
    
    try {
      const { data: { user }, error } = await db.supabase.auth.getUser();
      
      if (error) throw error;
      
      if (!user) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      // Get full user profile
      const profileResult = await this.getUserProfile(user.id);
      
      debugLog('getCurrentUser', {}, profileResult);
      
      return profileResult;
    } catch (error) {
      console.error('[DataService] Error getting current user:', error);
      return {
        success: false,
        data: null,
        error: createError(
          'Failed to get current user',
          'getCurrentUser',
          'Check authentication status',
          error
        )
      };
    }
  }
  // 📍 Used in: API routes, server actions, middleware

  /**
   * Get user profile with role information
   * @deprecated in React components - use useAuth() hook
   */
  static async getUserProfile(userId: string): Promise<ServiceResponse<AuthUser | null>> {
    warnIfReactComponent('getUserProfile');
    
    try {
      this.validateUUID(userId, 'userId');
      
      const { data, error } = await db.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      const authUser: AuthUser = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        fullName: data.full_name || undefined,
        profilePhoto: data.profile_photo || undefined,
        phoneNumber: data.phone_number || undefined,
        isActive: data.is_active ?? true,
        lastLogin: data.last_login || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      debugLog('getUserProfile', { userId }, authUser);
      
      return {
        success: true,
        data: authUser,
        error: null
      };
    } catch (error) {
      console.error('[DataService] Error getting user profile:', error);
      return {
        success: false,
        data: null,
        error: createError(
          'Failed to get user profile',
          'getUserProfile',
          'Verify user exists and you have permission',
          error
        )
      };
    }
  }
  // 📍 Used in: API routes for user verification

  // ============================================
  // SECTION 2: CHILDREN & ENROLLMENT
  // 🎣 Hook Alternative: useEntityOptions({ children: true })
  // ============================================

  /**
   * Get children enrolled in a specific class
   * @deprecated in React components - use useEntityOptions({ children: true })
   * @param classId - UUID of the class
   * @returns Array of children with enrollment info
   */
  static async getClassChildren(classId: string): Promise<ServiceResponse<Child[]>> {
    warnIfReactComponent('getClassChildren');
    
    try {
      this.validateUUID(classId, 'classId');
      
      const { data, error } = await db.supabase
        .from('child_class_assignments')
        .select(`
          child_id,
          status,
          enrollment_date,
          children (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            profile_photo,
            medical_notes,
            allergies,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'enrolled')
        .eq('is_active', true);

      if (error) throw error;
      
      const children: Child[] = data
        ?.map(item => item.children)
        .filter(Boolean)
        .map(child => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          gender: child.gender as 'male' | 'female' | 'other' | undefined,
          profilePhoto: child.profile_photo || undefined,
          medicalNotes: child.medical_notes || undefined,
          allergies: child.allergies || [],
          isActive: child.is_active,
          enrollmentDate: child.created_at,
          createdAt: child.created_at,
          updatedAt: child.updated_at
        })) || [];
      
      debugLog('getClassChildren', { classId }, { count: children.length });
      
      return {
        success: true,
        data: children,
        error: null
      };
    } catch (error) {
      console.error('Error loading class children:', error);
      return { 
        success: false, 
        data: [], 
        error: createError(
          'Failed to load class children',
          'getClassChildren',
          'In React components, use: useEntityOptions({ children: true })',
          error
        )
      };
    }
  }
  // 📍 Used in: API routes for class rosters, bulk operations

  /**
   * Bulk enroll children in a class
   * @param classId - Target class UUID
   * @param childIds - Array of child UUIDs to enroll
   */
  static async bulkEnrollChildren(
    classId: string, 
    childIds: string[]
  ): Promise<ServiceResponse<{
    enrolled: number;
    alreadyEnrolled: number;
    totalRequested: number;
    enrollmentRecords: any[];
  }>> {
    warnIfReactComponent('bulkEnrollChildren');
    
    try {
      // Validate inputs
      this.validateUUID(classId, 'classId');
      this.validateArray(childIds, 'childIds');
      childIds.forEach((id, index) => this.validateUUID(id, `childIds[${index}]`));

      if (childIds.length === 0) {
        return { 
          success: false, 
          data: null, 
          error: createError(
            'No children provided for enrollment',
            'bulkEnrollChildren',
            'Provide at least one child ID'
          )
        };
      }

      // Verify class exists and is active
      const { data: classData, error: classError } = await db.supabase
        .from('classes')
        .select('id, name, capacity, is_active')
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        throw createError(
          'Class not found',
          'bulkEnrollChildren',
          'Verify class ID is correct'
        );
      }

      if (!classData.is_active) {
        throw createError(
          'Cannot enroll in inactive class',
          'bulkEnrollChildren',
          'Only active classes accept enrollments'
        );
      }

      // Check current enrollment count
      const { count: currentEnrollment } = await db.supabase
        .from('child_class_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'enrolled');

      const totalEnrollment = (currentEnrollment || 0) + childIds.length;
      if (totalEnrollment > classData.capacity) {
        throw createError(
          `Class capacity exceeded`,
          'bulkEnrollChildren',
          `Capacity: ${classData.capacity}, Current: ${currentEnrollment}, Attempting: ${childIds.length}`
        );
      }

      // Check existing enrollments
      const { data: existingEnrollments } = await db.supabase
        .from('child_class_assignments')
        .select('child_id, class_id')
        .in('child_id', childIds)
        .eq('status', 'enrolled');

      const alreadyInThisClass = new Set(
        (existingEnrollments || [])
          .filter(e => e.class_id === classId)
          .map(e => e.child_id)
      );
      
      const enrolledElsewhere = new Set(
        (existingEnrollments || [])
          .filter(e => e.class_id !== classId)
          .map(e => e.child_id)
      );

      if (enrolledElsewhere.size > 0) {
        const blockedChildren = Array.from(enrolledElsewhere);
        throw createError(
          'Children already enrolled elsewhere',
          'bulkEnrollChildren',
          `Withdraw from current class first. Affected children: ${blockedChildren.join(', ')}`
        );
      }

      const newChildIds = childIds.filter(id => !alreadyInThisClass.has(id));

      if (newChildIds.length === 0) {
        return { 
          success: true, 
          data: { 
            enrolled: 0, 
            alreadyEnrolled: childIds.length,
            totalRequested: childIds.length,
            enrollmentRecords: []
          }, 
          error: null 
        };
      }

      // Create enrollment records
      const enrollments = newChildIds.map(childId => ({
        child_id: childId,
        class_id: classId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'enrolled' as EnrollmentStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await db.supabase
        .from('child_class_assignments')
        .insert(enrollments)
        .select();

      if (error) throw error;
      
      const result = {
        enrolled: data?.length || 0,
        alreadyEnrolled: alreadyInThisClass.size,
        totalRequested: childIds.length,
        enrollmentRecords: data || []
      };
      
      debugLog('bulkEnrollChildren', { classId, childIds }, result);
      
      return { 
        success: true, 
        data: result, 
        error: null 
      };
    } catch (error) {
      console.error('Error bulk enrolling:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : createError(
          'Failed to enroll children',
          'bulkEnrollChildren',
          undefined,
          error
        )
      };
    }
  }
  // 📍 Used in: Admin enrollment management, bulk import

  // ============================================
  // SECTION 3: ATTENDANCE
  // 🎣 Hook Alternative: None - use DataService
  // ============================================

  /**
   * Bulk update attendance for multiple children
   * No hook alternative - use this for bulk operations
   */
  static async bulkUpdateAttendance(updates: Array<{
    child_id: string;
    date: string;
    status: AttendanceStatus;
    check_in_time?: string;
    class_id: string;
  }>): Promise<ServiceResponse<AttendanceRecord[]>> {
    warnIfReactComponent('bulkUpdateAttendance');
    
    try {
      // Validate all inputs
      this.validateArray(updates, 'updates');
      
      updates.forEach((update, index) => {
        this.validateUUID(update.child_id, `updates[${index}].child_id`);
        this.validateUUID(update.class_id, `updates[${index}].class_id`);
        this.validateDate(update.date, `updates[${index}].date`);
        
        const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(update.status)) {
          throw createError(
            `Invalid attendance status: ${update.status}`,
            'bulkUpdateAttendance',
            `Use one of: ${validStatuses.join(', ')}`
          );
        }
      });

      // Get current user for audit
      const { data: { user } } = await db.supabase.auth.getUser();
      
      const records = updates.map(update => ({
        id: crypto.randomUUID(),
        child_id: update.child_id,
        attendance_date: update.date,
        status: update.status,
        check_in_time: update.check_in_time || 
          (update.status === 'present' ? new Date().toISOString() : null),
        class_id: update.class_id,
        checked_in_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await db.supabase
        .from('attendance_records')
        .upsert(records, {
          onConflict: 'child_id,attendance_date'
        })
        .select();

      if (error) throw error;

      const attendanceRecords: AttendanceRecord[] = (data || []).map(record => ({
        id: record.id,
        childId: record.child_id,
        classId: record.class_id,
        date: record.attendance_date,
        status: record.status as AttendanceStatus,
        checkInTime: record.check_in_time || undefined,
        checkOutTime: record.check_out_time || undefined,
        checkedInBy: record.checked_in_by || undefined,
        checkedOutBy: record.checked_out_by || undefined,
        notes: record.notes || undefined,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));

      debugLog('bulkUpdateAttendance', { count: updates.length }, { saved: data?.length });

      return { 
        success: true, 
        data: attendanceRecords, 
        error: null 
      };
    } catch (error) {
      console.error('Error updating attendance:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error : createError(
          'Failed to update attendance',
          'bulkUpdateAttendance',
          'Check all child and class IDs are valid',
          error
        )
      };
    }
  }
  // 📍 Used in: Teacher daily attendance, API bulk imports

  // ============================================
  // SECTION 4: COMPLEX OPERATIONS
  // 🎣 Hook Alternative: useTeacherDailyActivities()
  // ============================================

  /**
   * Mark activity complete for entire class
   * @deprecated in React components - use useTeacherDailyActivities().markClassComplete()
   */
  static async markClassActivityComplete(
    activityScheduleId: string,
    classId: string,
    teacherId: string,
    date: string
  ): Promise<ServiceResponse<{ progressRecords: number }>> {
    warnIfReactComponent('markClassActivityComplete');
    
    try {
      // Validate inputs
      this.validateUUID(activityScheduleId, 'activityScheduleId');
      this.validateUUID(classId, 'classId');
      this.validateUUID(teacherId, 'teacherId');
      this.validateDate(date, 'date');

      // Get all enrolled children
      const childrenResult = await this.getClassChildren(classId);
      if (!childrenResult.success) {
        throw createError(
          'Failed to get class children',
          'markClassActivityComplete',
          'Verify class ID and permissions',
          childrenResult.error
        );
      }

      const childIds = childrenResult.data.map(c => c.id);
      
      if (childIds.length === 0) {
        throw createError(
          'No children found in class',
          'markClassActivityComplete',
          'Class must have enrolled children'
        );
      }

      // Get activity details
      const { data: activity, error: activityError } = await db.supabase
        .from('activity_schedule')
        .select('curriculum_item_id')
        .eq('id', activityScheduleId)
        .single();

      if (activityError || !activity) {
        throw createError(
          'Activity not found',
          'markClassActivityComplete',
          'Verify activity schedule ID'
        );
      }

      // Create progress records for all children
      const progressRecords = childIds.map(childId => ({
        child_id: childId,
        curriculum_item_id: activity.curriculum_item_id,
        execution_date: date,
        status: 'completed' as ProgressStatus,
        quality_score: 4,
        engagement_level: 'medium' as EngagementLevel,
        teacher_notes: 'Class activity completed',
        parent_visible: true,
        created_by: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: progressError } = await db.supabase
        .from('progress_tracking')
        .upsert(progressRecords, {
          onConflict: 'child_id,curriculum_item_id,execution_date'
        });

      if (progressError) throw progressError;

      // Update activity status
      const { error: updateError } = await db.supabase
        .from('activity_schedule')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', activityScheduleId);

      if (updateError) throw updateError;

      debugLog('markClassActivityComplete', 
        { activityScheduleId, classId, childCount: childIds.length },
        { success: true }
      );

      return { 
        success: true, 
        data: { progressRecords: progressRecords.length },
        error: null 
      };
    } catch (error) {
      console.error('Error marking class activity complete:', error);
      return { 
        success: false, 
        data: null,
        error: error instanceof Error ? error : createError(
          'Failed to mark activity complete',
          'markClassActivityComplete',
          'In React: use useTeacherDailyActivities().markClassComplete()',
          error
        )
      };
    }
  }
  // 📍 Used in: API endpoints for bulk activity completion

  // ============================================
  // SECTION 5: PARENT DATA ACCESS
  // 🎣 Hook Alternative: useParentView()
  // ============================================

  /**
   * Get parent's children with enrollment details
   * @deprecated in React components - use useParentView().children
   */
  static async getParentChildren(parentId: string): Promise<ServiceResponse<ChildWithEnrollment[]>> {
    warnIfReactComponent('getParentChildren');
    
    try {
      this.validateUUID(parentId, 'parentId');

      // Get parent-child relationships
      const { data: relationships, error: relError } = await db.supabase
        .from('parent_child_relationships')
        .select('*')
        .eq('parent_id', parentId);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        return { success: true, data: [], error: null };
      }

      const childIds = relationships.map(rel => rel.child_id);

      // Get children with enrollment info
      const { data: children, error: childError } = await db.supabase
        .from('children')
        .select(`
          *,
          child_class_assignments!left (
            class_id,
            status,
            enrollment_date,
            classes (
              id,
              name,
              age_group,
              is_active
            )
          )
        `)
        .in('id', childIds)
        .eq('is_active', true);

      if (childError) throw childError;

      const childrenWithEnrollment: ChildWithEnrollment[] = (children || []).map(child => {
        const enrollment = child.child_class_assignments?.[0];
        
        return {
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          gender: child.gender as 'male' | 'female' | 'other' | undefined,
          profilePhoto: child.profile_photo || undefined,
          medicalNotes: child.medical_notes || undefined,
          allergies: child.allergies || [],
          isActive: child.is_active,
          enrollmentDate: enrollment?.enrollment_date || child.created_at,
          createdAt: child.created_at,
          updatedAt: child.updated_at,
          enrollment: enrollment ? {
            classId: enrollment.class_id,
            className: enrollment.classes?.name || 'Unknown',
            status: enrollment.status as EnrollmentStatus,
            enrollmentDate: enrollment.enrollment_date
          } : undefined
        };
      });

      debugLog('getParentChildren', { parentId }, { count: childrenWithEnrollment.length });

      return { 
        success: true, 
        data: childrenWithEnrollment, 
        error: null 
      };
    } catch (error) {
      console.error('Error in getParentChildren:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error : createError(
          'Failed to get parent children',
          'getParentChildren',
          'In React: use useParentView() hook',
          error
        )
      };
    }
  }
  // 📍 Used in: Parent API endpoints, server-side parent data

  /**
   * Get child's daily summary for parent view
   * @deprecated in React components - use useParentView().getChildDailyUpdate()
   */
  static async getChildDailySummary(
    childId: string, 
    date: string
  ): Promise<ServiceResponse<DailyUpdateForParent>> {
    warnIfReactComponent('getChildDailySummary');
    
    try {
      this.validateUUID(childId, 'childId');
      this.validateDate(date, 'date');

      // Fetch all data in parallel
      const [progress, attendance, meals, photos] = await Promise.all([
        db.supabase
          .from('progress_tracking')
          .select(`
            *,
            curriculum_items (title, activity_type, description)
          `)
          .eq('child_id', childId)
          .eq('execution_date', date)
          .eq('parent_visible', true),
        
        db.supabase
          .from('attendance_records')
          .select('*')
          .eq('child_id', childId)
          .eq('attendance_date', date)
          .maybeSingle(),
        
        db.supabase
          .from('meal_records')
          .select('*')
          .eq('child_id', childId)
          .eq('meal_date', date),
        
        db.supabase
          .from('attachments')
          .select('*')
          .eq('child_id', childId)
          .eq('is_parent_visible', true)
          .gte('created_at', `${date}T00:00:00`)
          .lte('created_at', `${date}T23:59:59`)
      ]);

      // Process activities
      const activities = (progress.data || []).map(p => ({
        title: p.curriculum_items?.title || 'Activity',
        type: p.curriculum_items?.activity_type || 'general',
        completed: p.status === 'completed',
        notes: p.teacher_notes || undefined
      }));

      // Process meals
      const mealData = (meals.data || []).map(m => ({
        mealType: m.meal_type,
        consumption: m.consumption
      }));

      // Determine mood based on engagement levels
      const engagementScores = (progress.data || [])
        .map(p => p.engagement_level)
        .filter(Boolean);
      
      let mood: 'happy' | 'neutral' | 'upset' | 'tired' = 'neutral';
      if (engagementScores.length > 0) {
        const highCount = engagementScores.filter(e => e === 'high').length;
        const lowCount = engagementScores.filter(e => e === 'low').length;
        
        if (highCount > engagementScores.length / 2) mood = 'happy';
        else if (lowCount > engagementScores.length / 2) mood = 'tired';
      }

      // Create highlights from high-scoring activities
      const highlights = (progress.data || [])
        .filter(p => p.quality_score >= 4)
        .map(p => `Excelled at ${p.curriculum_items?.title || 'activity'}`)
        .slice(0, 3);

      // Get teacher notes
      const teacherNotes = (progress.data || [])
        .map(p => p.teacher_notes)
        .filter(Boolean)
        .join(' ');

      const dailyUpdate: DailyUpdateForParent = {
        date,
        attendance: {
          status: attendance.data?.status || 'absent',
          arrivalTime: attendance.data?.check_in_time || undefined,
          departureTime: attendance.data?.check_out_time || undefined
        },
        activities,
        meals: mealData,
        mood,
        highlights,
        photos: photos.data || [],
        teacherNote: teacherNotes || undefined
      };

      debugLog('getChildDailySummary', { childId, date }, { hasData: true });

      return {
        success: true,
        data: dailyUpdate,
        error: null
      };
    } catch (error) {
      console.error('Error loading daily summary:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : createError(
          'Failed to load daily summary',
          'getChildDailySummary',
          'In React: use useParentView().getChildDailyUpdate()',
          error
        )
      };
    }
  }
  // 📍 Used in: Parent daily email generation, API endpoints

  // ============================================
  // SECTION 6: ANALYTICS & REPORTING
  // 🎣 Hook Alternative: useKMapAnalytics() for K-Map data
  // ============================================

  /**
   * Get class analytics for date range
   * No hook alternative - complex analytics operation
   */
  static async getClassAnalytics(
    classId: string, 
    dateRange: { start: string; end: string }
  ): Promise<ServiceResponse<{
    totalChildren: number;
    averageAttendance: number;
    completionRate: number;
    kmapProgress: KMapScores;
    topActivities: Array<{ curriculumItemId: string; count: number }>;
  }>> {
    warnIfReactComponent('getClassAnalytics');
    
    try {
      this.validateUUID(classId, 'classId');
      this.validateDate(dateRange.start, 'dateRange.start');
      this.validateDate(dateRange.end, 'dateRange.end');

      // Get all children in class
      const childrenResult = await this.getClassChildren(classId);
      if (!childrenResult.success) throw childrenResult.error;

      const childIds = childrenResult.data.map(c => c.id);

      if (childIds.length === 0) {
        return {
          success: true,
          data: {
            totalChildren: 0,
            averageAttendance: 0,
            completionRate: 0,
            kmapProgress: { move: 0, think: 0, endure: 0 },
            topActivities: []
          },
          error: null
        };
      }

      // Get aggregated data
      const [progressData, attendanceData, kmapData] = await Promise.all([
        db.supabase
          .from('progress_tracking')
          .select('*')
          .in('child_id', childIds)
          .gte('execution_date', dateRange.start)
          .lte('execution_date', dateRange.end),
        
        db.supabase
          .from('attendance_records')
          .select('*')
          .in('child_id', childIds)
          .gte('attendance_date', dateRange.start)
          .lte('attendance_date', dateRange.end),
        
        db.supabase
          .from('kmap_profiles')
          .select('*')
          .in('child_id', childIds)
          .gte('last_updated', dateRange.start)
          .lte('last_updated', dateRange.end)
      ]);

      // Calculate metrics
      const averageAttendance = this.calculateAverageAttendance(attendanceData.data || []);
      const completionRate = this.calculateCompletionRate(progressData.data || []);
      const kmapProgress = this.calculateKMapProgress(kmapData.data || []);
      const topActivities = this.getTopActivities(progressData.data || []);

      const analytics = {
        totalChildren: childrenResult.data.length,
        averageAttendance,
        completionRate,
        kmapProgress,
        topActivities
      };

      debugLog('getClassAnalytics', { classId, dateRange }, analytics);

      return { 
        success: true, 
        data: analytics, 
        error: null 
      };
    } catch (error) {
      console.error('Error generating analytics:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : createError(
          'Failed to generate analytics',
          'getClassAnalytics',
          'Check date range and class ID',
          error
        )
      };
    }
  }
  // 📍 Used in: Admin reports, API analytics endpoints

  // ============================================
  // SECTION 7: ADMIN OPERATIONS
  // 🎣 Hook Alternative: useCrud({ table: 'users' })
  // ============================================

  /**
   * Get users by role for admin management
   * @deprecated in React components - use useCrud({ table: 'users', filters: { role } })
   */
  static async getUsersByRole(role: UserRole): Promise<ServiceResponse<AuthUser[]>> {
    warnIfReactComponent('getUsersByRole');
    
    try {
      const validRoles: UserRole[] = ['admin', 'teacher', 'parent'];
      if (!validRoles.includes(role)) {
        throw createError(
          `Invalid role: ${role}`,
          'getUsersByRole',
          `Use one of: ${validRoles.join(', ')}`
        );
      }

      const { data, error } = await db.supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      
      const users: AuthUser[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        fullName: user.full_name || undefined,
        profilePhoto: user.profile_photo || undefined,
        phoneNumber: user.phone_number || undefined,
        isActive: user.is_active ?? true,
        lastLogin: user.last_login || undefined,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));

      debugLog('getUsersByRole', { role }, { count: users.length });
      
      return { 
        success: true, 
        data: users, 
        error: null 
      };
    } catch (error) {
      console.error('Error loading users:', error);
      return { 
        success: false, 
        data: [], 
        error: error instanceof Error ? error : createError(
          'Failed to load users',
          'getUsersByRole',
          'In React: use useCrud({ table: "users", filters: { role } })',
          error
        )
      };
    }
  }
  // 📍 Used in: Admin user management APIs

  // ============================================
  // HELPER METHODS (PRIVATE)
  // ============================================

  private static calculateAverageAttendance(attendanceData: any[]): number {
    if (!attendanceData.length) return 0;
    
    const presentCount = attendanceData.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendanceData.length) * 100);
  }

  private static calculateCompletionRate(progressData: any[]): number {
    if (!progressData.length) return 0;
    
    const completedCount = progressData.filter(p => p.status === 'completed').length;
    return Math.round((completedCount / progressData.length) * 100);
  }

  private static calculateKMapProgress(kmapData: any[]): KMapScores {
    if (!kmapData.length) return { move: 0, think: 0, endure: 0 };
    
    return {
      move: Math.round(
        kmapData.reduce((sum, k) => sum + (k.move_score || 0), 0) / kmapData.length
      ),
      think: Math.round(
        kmapData.reduce((sum, k) => sum + (k.think_score || 0), 0) / kmapData.length
      ),
      endure: Math.round(
        kmapData.reduce((sum, k) => sum + (k.endure_score || 0), 0) / kmapData.length
      )
    };
  }

  private static getTopActivities(progressData: any[]): Array<{ curriculumItemId: string; count: number }> {
    const activityCounts = progressData.reduce((acc, p) => {
      const key = p.curriculum_item_id;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([curriculumItemId, count]) => ({ curriculumItemId, count }));
  }
}

// ============================================
// EXPORT HELPERS
// ============================================

/**
 * Helper to check if code is running on server
 */
export const isServer = typeof window === 'undefined';

/**
 * Helper to ensure server-only code
 */
export function serverOnly<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args) => {
    if (!isServer) {
      throw new Error(
        `${fn.name} can only be called on the server. ` +
        `Use appropriate hooks in React components.`
      );
    }
    return fn(...args);
  }) as T;
}