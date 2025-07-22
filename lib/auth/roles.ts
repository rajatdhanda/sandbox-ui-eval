// lib/auth/roles.ts
// Path: lib/auth/roles.ts

export const UserRoles = {
  ADMIN: 'admin',
  TEACHER: 'teacher', 
  PARENT: 'parent'
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export const RolePermissions = {
  // Admin can access everything
  admin: {
    canAccessAllClasses: true,
    canAccessAllChildren: true,
    canAccessAllTeachers: true,
    canManageUsers: true,
    canManageCurriculum: true,
    canViewAnalytics: true,
    canAccessAdminDashboard: true,
    canAccessTeacherDashboard: true,
    canAccessParentDashboard: true
  },
  
  // Teacher can only access their assigned class
  teacher: {
    canAccessOwnClass: true,
    canViewClassChildren: true,
    canUpdateProgress: true,
    canUploadMedia: true,
    canViewCurriculum: true,
    canAccessTeacherDashboard: true,
    canAccessParentDashboard: false,
    canAccessAdminDashboard: false
  },
  
  // Parent can only see their own children
  parent: {
    canViewOwnChildren: true,
    canViewChildProgress: true,
    canViewParentVisibleMedia: true,
    canAccessParentDashboard: true,
    canAccessTeacherDashboard: false,
    canAccessAdminDashboard: false
  }
};