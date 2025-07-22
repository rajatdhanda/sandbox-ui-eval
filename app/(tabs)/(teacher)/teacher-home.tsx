// app/(tabs)/teacher-home.tsx
//checked once
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// ✅ BIBLE: Import types FIRST
import type { 
  UserRole,
  Child,
  ActivityWithProgress
} from '@/app/components/shared/type/data-service.types';

// ✅ BIBLE: Then import components
import { TeacherDailyDashboard } from '@/app/components/teacher/daily-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, typography } from '@/lib/styles';
import { LoadingState, EmptyState } from '@/app/components/shared/empty-state';
import { Users } from 'lucide-react-native';

// ✅ BIBLE: Type definitions
type TeacherTab = 'today' | 'activities' | 'children' | 'students' | 'progress' | 'insights' | 'capture' | 'k-map';
type TeacherRoute = '/(tabs)/(teacher)/activities' | '/(tabs)/(teacher)/students' | '/(tabs)/(teacher)/progress' | '/(tabs)/(teacher)/quick-capture';

// ✅ BIBLE: Constants
const TAB_ROUTES: Record<TeacherTab, TeacherRoute> = {
  'today': '/(tabs)/(teacher)/activities',
  'activities': '/(tabs)/(teacher)/activities',
  'children': '/(tabs)/(teacher)/students',
  'students': '/(tabs)/(teacher)/students',
  'progress': '/(tabs)/(teacher)/progress',
  'insights': '/(tabs)/(teacher)/quick-capture',
  'capture': '/(tabs)/(teacher)/quick-capture',
  'k-map': '/(tabs)/(teacher)/quick-capture'
};

export default function TeacherHomeScreen() {
  // ✅ BIBLE: Hooks at top level
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // ✅ BIBLE: State with proper types
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  
  // ✅ BIBLE: Event handlers
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        setSignInError(error.message);
      }
    } catch (err) {
      setSignInError('An error occurred during sign in');
    } finally {
      setIsSigningIn(false);
    }
  };
  
  // ✅ BIBLE: Handle all states - loading
  if (loading) {
    return <LoadingState message="Loading..." />;
  }
  
  // ✅ BIBLE: Handle all states - unauthenticated
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authContent}>
          <Text style={styles.authTitle}>Teacher Portal</Text>
          <Text style={styles.authSubtitle}>Please sign in to continue</Text>
          
          {signInError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{signInError}</Text>
            </View>
          )}
          
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            editable={!isSigningIn}
          />
          
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            editable={!isSigningIn}
          />
          
          <Button 
            title={isSigningIn ? "Signing in..." : "Sign In"} 
            onPress={handleSignIn}
            disabled={isSigningIn || !email || !password}
          />
        </View>
      </View>
    );
  }
  
  // ✅ BIBLE: Type safety with proper guard
  const userRole = user.role as UserRole;
  
  // ✅ BIBLE: Handle all states - no class for teacher
  if (userRole === 'teacher' && !user.classId) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Users size={48} color={colors.textSecondary} />}
          title="No Class Assigned"
          subtitle="Please contact your administrator to be assigned to a class."
        />
      </View>
    );
  }
  
  // ✅ BIBLE: Handle all states - no classes for admin
  if (userRole === 'admin' && (!user.classId || !user.classIds?.length)) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Users size={48} color={colors.textSecondary} />}
          title="No Classes Available"
          subtitle="Please create a class first in the admin panel."
        />
      </View>
    );
  }
  
  // ✅ BIBLE: Typed navigation handlers (NO ANY!)
  const handleNavigateToTab = (tab: string) => {
    const route = TAB_ROUTES[tab as TeacherTab];
    if (route) {
      router.push(route);
    }
  };
  
  // ✅ BIBLE: Proper types based on what dashboard actually shows
  const handleActivityPress = (activity: ActivityWithProgress) => {
    if (activity?.id) {
      router.push({
        pathname: '/(tabs)/(teacher)/activities',
        params: { activityId: activity.id }
      });
    }
  };
  
  const handleStudentPress = (child: Child) => {
    if (child?.id) {
      router.push({
        pathname: '/(tabs)/(teacher)/students',
        params: { studentId: child.id }
      });
    }
  };
  
  // ✅ BIBLE: Success state - render dashboard
  return (
  <TeacherDailyDashboard
    classId={user.classId!}
    teacherId={user.id}
    onActivityPress={handleActivityPress}
    onStudentPress={handleStudentPress}
    onNavigateToTab={handleNavigateToTab}
  />
);
}

// ✅ BIBLE: Styles using design system
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  authContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authTitle: {
    fontSize: typography.xxl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  authSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.base,
    color: colors.text,
    backgroundColor: colors.white,
  },
});