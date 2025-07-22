// lib/ai/providers/openai.ts
import { openai } from '../client';
import { logger } from '@/lib/utils/logger';
import type { AIModel, AIResponse } from '../types';

export interface OpenAIProviderConfig {
  apiKey?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
}

export class OpenAIProvider {
  private config: OpenAIProviderConfig;
  
  constructor(config?: OpenAIProviderConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
      organization: config?.organization,
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 30000
    };
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: AIModel;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json';
      functions?: any[];
      stream?: boolean;
    }
  ): Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        response_format: options?.responseFormat === 'json' 
          ? { type: 'json_object' } 
          : undefined,
        functions: options?.functions,
        stream: options?.stream || false
      });

      const completion = response.choices[0];
      const usage = response.usage;

      return {
        content: completion.message.content || '',
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        } : undefined,
        model: response.model
      };
    } catch (error: any) {
      logger.error('OPENAI_PROVIDER', 'CHAT_ERROR', error);
      throw this.transformError(error);
    }
  }

  async embedding(
    input: string | string[],
    options?: {
      model?: string;
      dimensions?: number;
    }
  ): Promise<{
    embeddings: number[][];
    usage: {
      promptTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      const response = await openai.embeddings.create({
        model: options?.model || 'text-embedding-3-small',
        input,
        dimensions: options?.dimensions
      });

      return {
        embeddings: response.data.map(d => d.embedding),
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error: any) {
      logger.error('OPENAI_PROVIDER', 'EMBEDDING_ERROR', error);
      throw this.transformError(error);
    }
  }

  async moderation(
    input: string | string[]
  ): Promise<{
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  }[]> {
    try {
      const response = await openai.moderations.create({ input });
      
      return response.results.map(result => ({
        flagged: result.flagged,
        categories: result.categories as any,
        scores: result.category_scores as any
      }));
    } catch (error: any) {
      logger.error('OPENAI_PROVIDER', 'MODERATION_ERROR', error);
      throw this.transformError(error);
    }
  }

  // Transform OpenAI errors to our standard format
  private transformError(error: any): Error {
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset-requests'];
      const err = new Error('OpenAI rate limit exceeded');
      (err as any).code = 'RATE_LIMIT';
      (err as any).resetTime = resetTime ? new Date(parseInt(resetTime) * 1000) : undefined;
      return err;
    }

    if (error.response?.status === 401) {
      const err = new Error('Invalid OpenAI API key');
      (err as any).code = 'AUTH_ERROR';
      return err;
    }

    if (error.response?.status === 404) {
      const err = new Error('Model not found or not accessible');
      (err as any).code = 'MODEL_NOT_FOUND';
      return err;
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      const err = new Error('OpenAI request timeout');
      (err as any).code = 'TIMEOUT';
      return err;
    }

    return error;
  }

  // Get available models
  async listModels(): Promise<string[]> {
    try {
      const response = await openai.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error: any) {
      logger.error('OPENAI_PROVIDER', 'LIST_MODELS_ERROR', error);
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    }
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await openai.models.list();
      return true;
    } catch (error) {
      logger.error('OPENAI_PROVIDER', 'INVALID_API_KEY', error);
      return false;
    }
  }

  // Stream chat response
  async *streamChat(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: AIModel;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await openai.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      logger.error('OPENAI_PROVIDER', 'STREAM_ERROR', error);
      throw this.transformError(error);
    }
  }
}

// Export singleton instance
export const openAIProvider = new OpenAIProvider();