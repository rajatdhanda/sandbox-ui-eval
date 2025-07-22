// lib/ai/framework/gateway.ts
import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';
import type { 
  AIRequest, 
  AIResponse, 
  AIModel,
  AIError 
} from '../types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIGateway {
  private static instance: AIGateway;

  private constructor() {}

  static getInstance(): AIGateway {
    if (!AIGateway.instance) {
      AIGateway.instance = new AIGateway();
    }
    return AIGateway.instance;
  }

  async executePrompt(
    prompt: string,
    options: {
      userId: string;
      model?: AIModel;
      temperature?: number;
      maxTokens?: number;
      useCache?: boolean;
      tier?: 'quick' | 'analysis' | 'report';
      context?: Record<string, any>;
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const model = options.model || 'gpt-3.5-turbo';

    try {
      logger.info('AI_GATEWAY', 'PROMPT_EXECUTION_START', {
        userId: options.userId,
        model,
        promptLength: prompt.length
      });

      // Execute AI request
      const response = await openai.chat.completions.create({
  model,
  messages: [
    {
      role: 'system',
      content: 'You are an expert in early childhood development and education.'
    },
    {
      role: 'user',
      content: options.context?.imageUrl ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: options.context.imageUrl } }
      ] : prompt
    }
  ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content || '{}';
      const usage = response.usage;

      // Log success
      logger.info('AI_GATEWAY', 'PROMPT_EXECUTION_SUCCESS', {
        userId: options.userId,
        model,
        duration: Date.now() - startTime,
        tokensUsed: usage?.total_tokens
      });

      // Parse and return response
      try {
        const parsed = JSON.parse(result);
        return {
          success: true,
          data: parsed,
          isValid: true,
          timestamp: new Date().toISOString()
        };
      } catch (parseError) {
        logger.error('AI_GATEWAY', 'PARSE_ERROR', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response',
          isValid: false,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error: any) {
      logger.error('AI_GATEWAY', 'PROMPT_EXECUTION_ERROR', error, {
        userId: options.userId,
        model
      });

      // Return error response
      return {
        success: false,
        error: error.message || 'AI request failed',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const aiGateway = AIGateway.getInstance();