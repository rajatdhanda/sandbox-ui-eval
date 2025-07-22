// hooks/use-auth.ts
// Path: hooks/use-auth.ts
import { useState, useEffect } from 'react';
// ✅ FIXED: Removed this line only
// import { DataService } from '@/app/components/shared/data-service';
import { db } from '@/lib/supabase/services/database.service';

interface AuthUser {
  id: string;
  email: string;
  classId?: string;     // For teachers - single class
  classIds?: string[];  // For admins - all classes
  role?: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await db.supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useAuth] Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('[useAuth] No active session');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const authUser = session.user;
        console.log('[useAuth] Session user:', authUser.email);
        
        // Get user profile from database
        const { data: userData, error: userError } = await db.supabase
          .from('users')
          .select('id, email, role')
          .eq('id', authUser.id)
          .single();
          
        if (userError || !userData) {
          console.error('[useAuth] Error fetching user data:', userError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        console.log('[useAuth] User role:', userData.role);
        
        // For admin or teacher, get class assignment
        // Handle admin and teacher differently
if (userData.role === 'admin') {
  // Admin: Get ALL active classes
  const { data: allClasses } = await db.supabase
    .from('classes')
    .select('id')
    .eq('is_active', true);
  
  console.log('[useAuth] Admin - all classes:', allClasses);
  
  if (mounted) {
    setUser({
      id: authUser.id,
      email: authUser.email!,
      role: userData.role,
      classIds: allClasses?.map(c => c.id) || [],
      classId: allClasses?.[0]?.id, // Default to first class
      isAdmin: true
    });
  }
} else if (userData.role === 'teacher') {
  // Teacher: Get their assigned class
  const { data: classAssignment } = await db.supabase
    .from('class_assignments')
    .select('class_id')
    .eq('teacher_id', authUser.id)
    .eq('is_active', true)
    .maybeSingle();
  
  console.log('[useAuth] Teacher class assignment:', classAssignment);
  
  if (mounted) {
    setUser({
      id: authUser.id,
      email: authUser.email!,
      role: userData.role,
      classId: classAssignment?.class_id
    });
  }
} else {
          // Parent or other roles
          if (mounted) {
            setUser({
              id: authUser.id,
              email: authUser.email!,
              role: userData.role
            });
          }
        }
      } catch (error) {
        console.error('[useAuth] Unexpected error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    // Subscribe to auth state changes
    const { data: { subscription } } = db.supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useAuth] Auth state changed:', _event);
      loadUser();
    });
    
    // Initial load
    loadUser();
    
    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}