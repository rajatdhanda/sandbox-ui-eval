// pages/api/ai/middleware/auth.ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    classId?: string;
  };
}

export function withAuth(
  handler: NextApiHandler,
  options?: {
    requireRole?: string[];
    checkChildAccess?: boolean;
  }
): NextApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get auth token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('AI_AUTH', 'MISSING_AUTH_HEADER', {
          path: req.url,
          method: req.method
        });
        
        return res.status(401).json({
          error: 'Missing authorization header'
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        logger.warn('AI_AUTH', 'INVALID_TOKEN', {
          error: error?.message,
          path: req.url
        });
        
        return res.status(401).json({
          error: 'Invalid authentication token'
        });
      }

      // Get user profile with role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (!profile) {
        logger.error('AI_AUTH', 'PROFILE_NOT_FOUND', {
          userId: user.id
        });
        
        return res.status(403).json({
          error: 'User profile not found'
        });
      }

      // Check role requirements
      if (options?.requireRole && !options.requireRole.includes(profile.role)) {
        logger.warn('AI_AUTH', 'INSUFFICIENT_ROLE', {
          userId: user.id,
          userRole: profile.role,
          requiredRoles: options.requireRole
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: options.requireRole,
          current: profile.role
        });
      }

      // Get teacher's class assignment if needed
      let classId: string | undefined;
      if (profile.role === 'teacher') {
        const { data: assignment } = await supabase
          .from('class_assignments')
          .select('class_id')
          .eq('teacher_id', user.id)
          .eq('is_active', true)
          .single();
        
        classId = assignment?.class_id;
      }

      // Check child access if required
      if (options?.checkChildAccess && req.body?.childId) {
        const hasAccess = await checkChildAccess(
          user.id,
          profile.role,
          req.body.childId,
          classId
        );

        if (!hasAccess) {
          logger.warn('AI_AUTH', 'CHILD_ACCESS_DENIED', {
            userId: user.id,
            childId: req.body.childId,
            role: profile.role
          });
          
          return res.status(403).json({
            error: 'Access denied to this child\'s data'
          });
        }
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email!,
        role: profile.role,
        classId
      };

      logger.info('AI_AUTH', 'AUTH_SUCCESS', {
        userId: user.id,
        role: profile.role,
        path: req.url
      });

      // Call the actual handler
      return handler(req, res);
      
    } catch (error: any) {
      logger.error('AI_AUTH', 'AUTH_ERROR', error);
      
      return res.status(500).json({
        error: 'Authentication error',
        message: error.message
      });
    }
  };
}

async function checkChildAccess(
  userId: string,
  role: string,
  childId: string,
  classId?: string
): Promise<boolean> {
  // Admins have access to all children
  if (role === 'admin') {
    return true;
  }

  // Teachers have access to children in their class
  if (role === 'teacher' && classId) {
    const { data } = await supabase
      .from('child_class_assignments')
      .select('id')
      .eq('child_id', childId)
      .eq('class_id', classId)
      .eq('status', 'enrolled')
      .single();
    
    return !!data;
  }

  // Parents have access to their own children
  if (role === 'parent') {
    const { data } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', userId)
      .eq('child_id', childId)
      .eq('is_active', true)
      .single();
    
    return !!data;
  }

  return false;
}

// Export types
export type { AuthenticatedRequest };