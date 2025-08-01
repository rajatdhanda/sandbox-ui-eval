// app/components/shared/auth-service.tsx
// Path: app/components/shared/auth-service.tsx

import { UserRole } from '@/lib/auth/roles';
import { supabase } from '@/lib/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  classId?: string;
  childIds?: string[]; // For parents
}

interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
}

export class AuthService {
  /**
   * Get current authenticated user with full profile
   */
  static async getCurrentAuthUser(): Promise<AuthResponse<AuthUser | null>> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: true, data: null };
      }

      const authUser = session.user;
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('id', authUser.id)
        .single();
        
      if (userError || !userData) {
        return { success: false, error: userError };
      }

      let authUserData: AuthUser = {
        id: authUser.id,
        email: authUser.email!,
        role: userData.role as UserRole
      };

      // Role-specific data loading
      switch (userData.role) {
        case 'admin':
        case 'teacher':
          // Get class assignment
          const { data: classAssignment } = await supabase
            .from('class_assignments')
            .select('class_id')
            .eq('teacher_id', authUser.id)
            .eq('is_active', true)
            .maybeSingle();
            
          authUserData.classId = classAssignment?.class_id;
          break;
          
        case 'parent':
          // Get children
          const { data: relationships } = await supabase
            .from('parent_child_relationships')
            .select('child_id')
            .eq('parent_id', authUser.id);
            
          authUserData.childIds = relationships?.map(r => r.child_id) || [];
          break;
      }

      return { success: true, data: authUserData };
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if user has permission for specific action
   */
  static async checkPermission(action: string, resourceId?: string): Promise<boolean> {
    const { data: user } = await this.getCurrentAuthUser();
    
    if (!user) return false;

    // Admin can do everything
    if (user.role === 'admin') return true;

    // Role-based checks
    switch (action) {
      case 'view_class':
        return user.role === 'teacher' && user.classId === resourceId;
        
      case 'update_progress':
        return user.role === 'teacher' && user.classId !== undefined;
        
      case 'view_child':
        if (user.role === 'teacher') {
          // Check if child is in teacher's class
          const { data } = await supabase
            .from('child_class_assignments')
            .select('id')
            .eq('child_id', resourceId!)
            .eq('class_id', user.classId!)
            .single();
          return !!data;
        }
        if (user.role === 'parent') {
          return user.childIds?.includes(resourceId!) || false;
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Sign in
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Get auth state
   */
  static subscribeToAuthChanges(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data } = await this.getCurrentAuthUser();
        callback(data || null);
      } else {
        callback(null);
      }
    });
  }
}