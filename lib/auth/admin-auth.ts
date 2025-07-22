// lib/auth/admin-auth.ts
import { supabase } from '@/lib/supabase/client';

const ADMIN_CREDENTIALS = {
  email: 'admin2@example.com',
  password: 'admin2'
};

export const ensureAdminAuth = async (): Promise<boolean> => {
  try {
    console.log('🔐 Checking current authentication...');
    
    // Check if already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Already authenticated as:', user.email);
      return true;
    }
    
    console.log('🔄 No user authenticated, logging in as admin...');
    
    // Sign in as admin
    const { data, error } = await supabase.auth.signInWithPassword(ADMIN_CREDENTIALS);
    
    if (error) {
      console.error('❌ Admin login failed:', error);
      return false;
    }
    
    console.log('✅ Successfully logged in as admin:', data.user?.email);
    return true;
    
  } catch (error) {
    console.error('💥 Error during admin authentication:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const isAdminUser = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.email === ADMIN_CREDENTIALS.email;
};