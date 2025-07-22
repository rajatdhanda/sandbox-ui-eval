// lib/ai/framework/fallback-handler.ts
import { logger } from '@/lib/utils/logger';
import type { AIModel } from '../types';

export type FallbackStrategy = 'retry' | 'downgrade' | 'cached' | 'default';

interface FallbackContext {
  prompt: string;
  options: any;
  attemptNumber: number;
  gateway?: any;
}

export interface FallbackResult {
  strategy: FallbackStrategy;
  success: boolean;
  data?: any;
  message?: string;
}

export class FallbackHandler {
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff
  
  async handle(error: any, context: FallbackContext): Promise<FallbackResult> {
    logger.warn('FALLBACK_HANDLER', 'HANDLING_ERROR', {
      error: error.message,
      attempt: context.attemptNumber,
      model: context.options.model
    });

    // Determine error type and appropriate strategy
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'rate_limit':
        return this.handleRateLimit(error, context);
        
      case 'timeout':
        return this.handleTimeout(error, context);
        
      case 'model_error':
        return this.handleModelError(error, context);
        
      case 'network':
        return this.handleNetworkError(error, context);
        
      case 'validation':
        return this.handleValidationError(error, context);
        
      default:
        return this.handleGenericError(error, context);
    }
  }

  private classifyError(error: any): string {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    if (message.includes('rate limit') || code === '429') {
      return 'rate_limit';
    }
    
    if (message.includes('timeout') || code === 'etimedout') {
      return 'timeout';
    }
    
    if (message.includes('model') || message.includes('gpt')) {
      return 'model_error';
    }
    
    if (message.includes('network') || message.includes('fetch') || code === 'econnrefused') {
      return 'network';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'generic';
  }

  private async handleRateLimit(error: any, context: FallbackContext): Promise<FallbackResult> {
    logger.info('FALLBACK_HANDLER', 'RATE_LIMIT_STRATEGY', {
      attempt: context.attemptNumber
    });

    // For rate limits, try downgrading model first
    if (context.attemptNumber === 1) {
      return {
        strategy: 'downgrade',
        success: false,
        message: 'Downgrading model due to rate limit'
      };
    }

    // Then check for cached response
    if (context.gateway && context.attemptNumber === 2) {
      try {
        const cacheKey = context.gateway.cache.generateKey(
          context.prompt,
          { ...context.options, fuzzy: true }
        );
        const cached = await context.gateway.cache.get(cacheKey);
        
        if (cached) {
          return {
            strategy: 'cached',
            success: true,
            data: cached,
            message: 'Using cached response due to rate limit'
          };
        }
      } catch (cacheError) {
        logger.error('FALLBACK_HANDLER', 'CACHE_CHECK_FAILED', cacheError);
      }
    }

    // Finally, return default response
    return {
      strategy: 'default',
      success: false,
      message: 'Rate limit exceeded, please try again later'
    };
  }

  private async handleTimeout(error: any, context: FallbackContext): Promise<FallbackResult> {
    if (this.shouldRetry(error, context)) {
      return {
        strategy: 'retry',
        success: false,
        message: `Retrying after timeout (attempt ${context.attemptNumber + 1})`
      };
    }

    return {
      strategy: 'default',
      success: false,
      message: 'Request timed out'
    };
  }

  private async handleModelError(error: any, context: FallbackContext): Promise<FallbackResult> {
    const downgradeModel = this.downgradeModel(context.options.model || 'gpt-3.5-turbo');
    
    if (downgradeModel && context.attemptNumber <= 2) {
      return {
        strategy: 'downgrade',
        success: false,
        message: `Downgrading to ${downgradeModel} due to model error`
      };
    }

    return {
      strategy: 'default',
      success: false,
      message: 'AI model unavailable'
    };
  }

  private async handleNetworkError(error: any, context: FallbackContext): Promise<FallbackResult> {
    if (this.shouldRetry(error, context)) {
      return {
        strategy: 'retry',
        success: false,
        message: 'Retrying after network error'
      };
    }

    // Try to find any cached response
    if (context.gateway) {
      try {
        const stats = await context.gateway.cache.getStats();
        if (stats.size > 0) {
          return {
            strategy: 'cached',
            success: false,
            message: 'Network unavailable, checking cache'
          };
        }
      } catch {}
    }

    return {
      strategy: 'default',
      success: false,
      message: 'Network connection error'
    };
  }

  private async handleValidationError(error: any, context: FallbackContext): Promise<FallbackResult> {
    logger.error('FALLBACK_HANDLER', 'VALIDATION_ERROR', {
      error: error.message,
      prompt: context.prompt.substring(0, 100)
    });

    return {
      strategy: 'default',
      success: false,
      message: 'Invalid request format'
    };
  }

  private async handleGenericError(error: any, context: FallbackContext): Promise<FallbackResult> {
    if (this.shouldRetry(error, context)) {
      return {
        strategy: 'retry',
        success: false,
        message: 'Retrying after error'
      };
    }

    return {
      strategy: 'default',
      success: false,
      message: 'An error occurred processing your request'
    };
  }

  shouldRetry(error: any, context: FallbackContext): boolean {
    // Don't retry validation errors
    if (this.classifyError(error) === 'validation') {
      return false;
    }

    // Check attempt number
    if (context.attemptNumber >= this.retryDelays.length) {
      return false;
    }

    // Don't retry if explicitly told not to
    if (error.retry === false) {
      return false;
    }

    return true;
  }

  getRetryDelay(attemptNumber: number): number {
    return this.retryDelays[Math.min(attemptNumber - 1, this.retryDelays.length - 1)];
  }

  downgradeModel(currentModel: AIModel): AIModel | null {
    const downgradeMap: Record<AIModel, AIModel | null> = {
      'gpt-4': 'gpt-4-turbo-preview',
      'gpt-4-turbo-preview': 'gpt-3.5-turbo',
      'gpt-3.5-turbo': null // No downgrade available
    };

    return downgradeMap[currentModel] || null;
  }

  // Generate a safe default response based on context
  generateDefaultResponse(context: FallbackContext): any {
    const tier = context.options.tier || 'quick';
    
    if (tier === 'quick') {
      return {
        insights: ['Unable to generate insights at this time. Please try again.'],
        trend: 'unknown',
        highlight: null
      };
    }

    if (tier === 'analysis') {
      return {
        patterns: [],
        insights: {
          summary: 'Analysis temporarily unavailable',
          recommendations: {
            activities: ['Continue with regular activities'],
            focusAreas: ['Maintain current approach']
          }
        }
      };
    }

    return {
      success: false,
      message: 'Service temporarily unavailable'
    };
  }
}