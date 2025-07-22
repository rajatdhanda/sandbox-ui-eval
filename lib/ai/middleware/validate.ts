// pages/api/ai/middleware/validate.ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { z, ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/utils/logger';

// Common validation schemas
export const schemas = {
  childAnalysis: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    analysisType: z.enum(['quick', 'comprehensive', 'milestone']),
    dateRange: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    }).optional(),
    includeAttachments: z.boolean().optional(),
    options: z.object({
      focusAreas: z.array(z.string()).optional(),
      compareToClass: z.boolean().optional()
    }).optional()
  }),

  classAnalysis: z.object({
    classId: z.string().uuid('Invalid class ID format'),
    period: z.enum(['day', 'week', 'month']).optional(),
    options: z.object({
      compareToAverage: z.boolean().optional(),
      generateReport: z.boolean().optional(),
      includeIndividuals: z.boolean().optional()
    }).optional()
  }),

  recommendations: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    area: z.enum(['behavioral', 'academic', 'social', 'physical', 'creative']),
    limit: z.number().min(1).max(20).optional().default(5),
    difficulty: z.enum(['easy', 'moderate', 'challenging']).optional()
  }),

  parentReport: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    period: z.enum(['weekly', 'monthly']),
    format: z.enum(['summary', 'detailed']).optional().default('summary'),
    language: z.string().optional().default('en')
  })
};

// Input sanitization functions
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential prompt injection attempts
    return input
      .replace(/\{\{.*?\}\}/g, '') // Remove template variables
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\n{3,}/g, '\n\n') // Limit newlines
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

export function withValidation<T = any>(
  schema: ZodSchema<T>,
  options?: {
    sanitize?: boolean;
    maxBodySize?: number;
  }
): (handler: NextApiHandler) => NextApiHandler {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Check request method
        if (req.method !== 'POST' && req.method !== 'PUT') {
          return res.status(405).json({
            error: 'Method not allowed',
            allowed: ['POST', 'PUT']
          });
        }

        // Check body size
        const bodySize = JSON.stringify(req.body || {}).length;
        const maxSize = options?.maxBodySize || 100000; // 100KB default
        
        if (bodySize > maxSize) {
          logger.warn('AI_VALIDATE', 'BODY_TOO_LARGE', {
            size: bodySize,
            maxSize,
            path: req.url
          });
          
          return res.status(413).json({
            error: 'Request body too large',
            maxSize
          });
        }

        // Sanitize input if requested
        let validatedData = req.body;
        if (options?.sanitize !== false) {
          validatedData = sanitizeInput(req.body);
        }

        // Validate against schema
        const parsed = await schema.parseAsync(validatedData);
        
        // Replace body with validated data
        req.body = parsed;

        logger.info('AI_VALIDATE', 'VALIDATION_SUCCESS', {
          path: req.url,
          schema: schema._def.typeName
        });

        // Call the handler
        return handler(req, res);
        
      } catch (error) {
        if (error instanceof ZodError) {
          logger.warn('AI_VALIDATE', 'VALIDATION_FAILED', {
            path: req.url,
            errors: error.errors
          });
          
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }

        logger.error('AI_VALIDATE', 'VALIDATION_ERROR', error);
        
        return res.status(500).json({
          error: 'Validation error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  };
}

// Specific validators for common use cases
export const validateChildAnalysis = withValidation(schemas.childAnalysis);
export const validateClassAnalysis = withValidation(schemas.classAnalysis);
export const validateRecommendations = withValidation(schemas.recommendations);
export const validateParentReport = withValidation(schemas.parentReport);

// Helper to check for prompt injection attempts
export function detectPromptInjection(text: string): boolean {
  const suspiciousPatterns = [
    /ignore.*previous.*instructions/i,
    /forget.*everything/i,
    /system.*prompt/i,
    /\{\{.*\}\}/,
    /\[\[.*\]\]/,
    /act.*as.*if/i,
    /pretend.*you.*are/i,
    /new.*instructions.*:/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(text));
}

// Rate limit check (works with our rate limiter)
export function withRateLimit(
  tier: 'quick' | 'analysis' | 'report' = 'quick'
): (handler: NextApiHandler) => NextApiHandler {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest & { user?: any }, res: NextApiResponse) => {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        // This would connect to our RateLimiter
        // For now, just pass through
        logger.info('AI_VALIDATE', 'RATE_CHECK', {
          userId: req.user.id,
          tier
        });

        return handler(req, res);
      } catch (error: any) {
        if (error.name === 'RateLimitError') {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: error.resetTime
          });
        }

        throw error;
      }
    };
  };
}