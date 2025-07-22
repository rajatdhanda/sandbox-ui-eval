// pages/api/ai/middleware/rate-limit.ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { aiGateway } from '@/lib/ai/framework/gateway';
import { logger } from '@/lib/utils/logger';

interface RateLimitedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function withRateLimit(
  tier: 'quick' | 'analysis' | 'report' = 'quick'
): (handler: NextApiHandler) => NextApiHandler {
  return (handler: NextApiHandler) => {
    return async (req: RateLimitedRequest, res: NextApiResponse) => {
      // Ensure user is authenticated
      if (!req.user?.id) {
        logger.warn('RATE_LIMIT_MW', 'NO_USER_CONTEXT', {
          path: req.url
        });
        
        return res.status(401).json({
          error: 'Authentication required for rate limiting'
        });
      }

      try {
        // Use the rate limiter from our AI gateway
        const rateLimiter = (aiGateway as any).rateLimiter;
        
        // Check rate limit
        await rateLimiter.checkLimit(req.user.id, tier);
        
        logger.info('RATE_LIMIT_MW', 'RATE_CHECK_PASSED', {
          userId: req.user.id,
          tier,
          path: req.url
        });

        // Add rate limit headers
        const remaining = await rateLimiter.getRemainingQuota(req.user.id, tier);
        
        res.setHeader('X-RateLimit-Limit-Hour', remaining.hourly.toString());
        res.setHeader('X-RateLimit-Limit-Minute', remaining.minute.toString());
        res.setHeader('X-RateLimit-Reset-Hour', remaining.resetHour.toISOString());
        res.setHeader('X-RateLimit-Reset-Minute', remaining.resetMinute.toISOString());

        // Call the handler
        return handler(req, res);
        
      } catch (error: any) {
        if (error.name === 'RateLimitError') {
          logger.warn('RATE_LIMIT_MW', 'RATE_LIMIT_EXCEEDED', {
            userId: req.user.id,
            tier,
            resetTime: error.resetTime
          });
          
          // Add retry-after header
          const retryAfter = Math.ceil((error.resetTime.getTime() - Date.now()) / 1000);
          res.setHeader('Retry-After', retryAfter.toString());
          
          return res.status(429).json({
            error: 'Too many requests',
            message: error.message,
            retryAfter: retryAfter,
            resetTime: error.resetTime.toISOString()
          });
        }

        logger.error('RATE_LIMIT_MW', 'RATE_CHECK_ERROR', error);
        
        return res.status(500).json({
          error: 'Rate limit check failed',
          message: error.message
        });
      }
    };
  };
}

// Composite middleware for auth + rate limit
export function withAuthAndRateLimit(
  tier: 'quick' | 'analysis' | 'report' = 'quick',
  authOptions?: {
    requireRole?: string[];
    checkChildAccess?: boolean;
  }
): (handler: NextApiHandler) => NextApiHandler {
  return (handler: NextApiHandler) => {
    // Import auth middleware
    const { withAuth } = require('./auth');
    
    // Chain middlewares: auth first, then rate limit
    return withAuth(
      withRateLimit(tier)(handler),
      authOptions
    );
  };
}

// Helper to get current usage for a user
export async function getUserRateLimitStatus(
  userId: string
): Promise<{
  quick: { used: number; limit: number; resetAt: Date };
  analysis: { used: number; limit: number; resetAt: Date };
  report: { used: number; limit: number; resetAt: Date };
}> {
  const rateLimiter = (aiGateway as any).rateLimiter;
  
  const tiers = ['quick', 'analysis', 'report'] as const;
  const status: any = {};
  
  for (const tier of tiers) {
    const quota = await rateLimiter.getRemainingQuota(userId, tier);
    const limits = {
      quick: { hour: 100, minute: 10 },
      analysis: { hour: 20, minute: 2 },
      report: { hour: 5, minute: 1 }
    };
    
    status[tier] = {
      used: limits[tier].hour - quota.hourly,
      limit: limits[tier].hour,
      resetAt: quota.resetHour
    };
  }
  
  return status;
}