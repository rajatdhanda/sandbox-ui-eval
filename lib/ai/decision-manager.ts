// lib/ai/decision-manager.ts
import { logger } from '@/lib/utils/logger';
import type { AIModel } from './types';

export interface AIDecision {
  pipeline: 'quick' | 'analysis' | 'recommendations' | 'report' | 'comparison';
  dataRequirements: DataRequirements;
  aiConfiguration: AIConfiguration;
  outputFormat: OutputFormat;
}

export interface DataRequirements {
  sources: DataSource[];
  dateRange: { start: string; end: string } | 'last7days' | 'last30days' | 'last90days';
  filters: Record<string, any>;
  includes: string[];
  excludes: string[];
  aggregations?: AggregationType[];
}

export interface DataSource {
  table: string;
  fields: string[];
  conditions?: Record<string, any>;
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

export interface AIConfiguration {
  model: AIModel;
  template: string;
  temperature: number;
  maxTokens: number;
  tier: 'quick' | 'analysis' | 'report';
  cacheEnabled: boolean;
  cacheTTL?: number;
}

export interface OutputFormat {
  structure: Record<string, any>;
  validations: string[];
  transformations: string[];
}

type AggregationType = 'count' | 'average' | 'sum' | 'min' | 'max' | 'groupBy';

export class AIDecisionManager {
  private static instance: AIDecisionManager;
  
  private decisionTree: Record<string, AIDecision> = {
    // Quick insights - minimal data, fast response
    'quick_insight': {
      pipeline: 'quick',
      dataRequirements: {
        sources: [
          {
            table: 'progress_tracking',
            fields: ['observation_type', 'quality_score', 'engagement_level', 'created_at'],
            conditions: { 'created_at': { gte: 'last7days' } },
            limit: 50,
            orderBy: { field: 'created_at', direction: 'desc' }
          }
        ],
        dateRange: 'last7days',
        filters: {},
        includes: ['observation_type', 'quality_score'],
        excludes: ['attachments', 'detailed_notes'],
        aggregations: ['count', 'average']
      },
      aiConfiguration: {
        model: 'gpt-3.5-turbo',
        template: 'QUICK_INSIGHT_TEMPLATE',
        temperature: 0.7,
        maxTokens: 500,
        tier: 'quick',
        cacheEnabled: true,
        cacheTTL: 3600 // 1 hour
      },
      outputFormat: {
        structure: {
          insight: 'string',
          trend: 'enum:improving|stable|needs_attention',
          highlight: 'string',
          focusArea: 'string'
        },
        validations: ['insight.length > 10', 'trend !== null'],
        transformations: ['capitalize_sentences', 'remove_technical_terms']
      }
    },

    // Comprehensive analysis - all data, detailed insights
    'full_analysis': {
      pipeline: 'analysis',
      dataRequirements: {
        sources: [
          {
            table: 'progress_tracking',
            fields: ['*'],
            conditions: { 'created_at': { gte: 'last90days' } },
            orderBy: { field: 'execution_date', direction: 'desc' }
          },
          {
            table: 'attachments',
            fields: ['id', 'type', 'caption'],
            conditions: { 'type': { in: ['photo', 'document'] } }
          },
          {
            table: 'children',
            fields: ['id', 'first_name', 'date_of_birth'],
            conditions: { 'is_active': true }
          }
        ],
        dateRange: 'last90days',
        filters: {},
        includes: ['all_observations', 'patterns', 'milestones'],
        excludes: [],
        aggregations: ['count', 'average', 'groupBy']
      },
      aiConfiguration: {
        model: 'gpt-4-turbo-preview',
        template: 'COMPREHENSIVE_ANALYSIS_TEMPLATE',
        temperature: 0.6,
        maxTokens: 2500,
        tier: 'analysis',
        cacheEnabled: true,
        cacheTTL: 86400 // 24 hours
      },
      outputFormat: {
        structure: {
          summary: 'string:2-3 sentences',
          patterns: 'array<Pattern>',
          milestones: 'object<achieved,emerging,focus>',
          kmapScores: 'object<move:number,think:number,endure:number>',
          recommendations: 'object<activities,supports,partnership>'
        },
        validations: [
          'patterns.length >= 1',
          'kmapScores.move between 0-10',
          'summary.length > 50'
        ],
        transformations: ['enrich_with_age_context', 'add_developmental_stage']
      }
    },

    // Activity recommendations
    'recommendations': {
      pipeline: 'recommendations',
      dataRequirements: {
        sources: [
          {
            table: 'progress_tracking',
            fields: ['observation_type', 'quality_score', 'teacher_notes'],
            conditions: { 
              'quality_score': { gte: 3 },
              'created_at': { gte: 'last30days' }
            },
            limit: 100
          },
          {
            table: 'curriculum_items',
            fields: ['id', 'title', 'activity_type', 'materials_needed'],
            conditions: { 'is_active': true }
          }
        ],
        dateRange: 'last30days',
        filters: { 'focus_on_strengths': true },
        includes: ['successful_activities', 'available_resources'],
        excludes: ['failed_activities'],
        aggregations: ['groupBy']
      },
      aiConfiguration: {
        model: 'gpt-3.5-turbo',
        template: 'RECOMMENDATION_TEMPLATE',
        temperature: 0.8,
        maxTokens: 1000,
        tier: 'quick',
        cacheEnabled: true,
        cacheTTL: 7200 // 2 hours
      },
      outputFormat: {
        structure: {
          recommendations: 'array<Activity>',
          weeklyPlan: 'object<monday-friday>',
          materials: 'array<string>',
          rationale: 'string'
        },
        validations: ['recommendations.length >= 3'],
        transformations: ['sort_by_priority', 'add_material_links']
      }
    },

    // Parent reports - filtered, positive framing
    'parent_report': {
      pipeline: 'report',
      dataRequirements: {
        sources: [
          {
            table: 'progress_tracking',
            fields: ['observation_type', 'teacher_notes', 'quality_score'],
            conditions: { 
              'parent_visible': true,
              'quality_score': { gte: 3 }
            },
            orderBy: { field: 'quality_score', direction: 'desc' },
            limit: 20
          },
          {
            table: 'attachments',
            fields: ['url', 'caption'],
            conditions: { 
              'is_parent_visible': true,
              'type': 'photo'
            },
            limit: 5
          }
        ],
        dateRange: 'last7days',
        filters: { 'positive_only': true },
        includes: ['achievements', 'progress', 'photos'],
        excludes: ['concerns', 'needs_support'],
        aggregations: []
      },
      aiConfiguration: {
        model: 'gpt-3.5-turbo',
        template: 'PARENT_REPORT_TEMPLATE',
        temperature: 0.7,
        maxTokens: 800,
        tier: 'quick',
        cacheEnabled: false, // Fresh for each parent
        cacheTTL: 0
      },
      outputFormat: {
        structure: {
          greeting: 'string',
          highlights: 'array<string>:max3',
          favoriteActivity: 'string',
          specialMoment: 'string',
          weekendSuggestion: 'string',
          photos: 'array<url>'
        },
        validations: ['positive_tone_check'],
        transformations: ['warm_language', 'parent_friendly_terms']
      }
    }
  };

  static getInstance(): AIDecisionManager {
    if (!AIDecisionManager.instance) {
      AIDecisionManager.instance = new AIDecisionManager();
    }
    return AIDecisionManager.instance;
  }

  // Main decision method
  async decide(context: {
    requestType: string;
    childId?: string;
    userId: string;
    role: string;
    options?: Record<string, any>;
  }): Promise<AIDecision> {
    logger.info('AI_DECISION', 'ANALYZING_REQUEST', context);

    // Get base decision
    const decision = this.decisionTree[context.requestType];
    if (!decision) {
      throw new Error(`Unknown request type: ${context.requestType}`);
    }

    // Customize based on context
    const customized = this.customizeDecision(decision, context);

    // Apply role-based filters
    const filtered = this.applyRoleFilters(customized, context.role);

    // Optimize based on current load
    const optimized = await this.optimizeForLoad(filtered);

    logger.info('AI_DECISION', 'DECISION_MADE', {
      pipeline: optimized.pipeline,
      model: optimized.aiConfiguration.model,
      dataPoints: optimized.dataRequirements.sources.length
    });

    return optimized;
  }

  private customizeDecision(
    decision: AIDecision, 
    context: any
  ): AIDecision {
    const customized = { ...decision };

    // Customize date range
    if (context.options?.dateRange) {
      customized.dataRequirements.dateRange = context.options.dateRange;
    }

    // Add child filter
    if (context.childId) {
      customized.dataRequirements.sources.forEach(source => {
        if (source.table === 'progress_tracking') {
          source.conditions = {
            ...source.conditions,
            child_id: context.childId
          };
        }
      });
    }

    // Adjust for specific focus areas
    if (context.options?.focusAreas) {
      customized.dataRequirements.filters.focusAreas = context.options.focusAreas;
    }

    return customized;
  }

  private applyRoleFilters(
    decision: AIDecision,
    role: string
  ): AIDecision {
    const filtered = { ...decision };

    if (role === 'parent') {
      // Parents only see parent-visible data
      filtered.dataRequirements.sources.forEach(source => {
        if (source.table === 'progress_tracking') {
          source.conditions = {
            ...source.conditions,
            parent_visible: true
          };
        }
      });
      
      // Use simpler language
      filtered.outputFormat.transformations.push('simplify_language');
    }

    if (role === 'teacher') {
      // Teachers see more detailed data
      filtered.dataRequirements.includes.push('detailed_observations');
    }

    return filtered;
  }

  private async optimizeForLoad(decision: AIDecision): Promise<AIDecision> {
    // Check current system load
    const load = await this.getSystemLoad();
    const optimized = { ...decision };

    if (load.high) {
      // Downgrade model if load is high
      if (optimized.aiConfiguration.model === 'gpt-4') {
        optimized.aiConfiguration.model = 'gpt-3.5-turbo';
        optimized.aiConfiguration.maxTokens = Math.floor(
          optimized.aiConfiguration.maxTokens * 0.7
        );
      }

      // Reduce data fetching
      optimized.dataRequirements.sources.forEach(source => {
        if (source.limit) {
          source.limit = Math.floor(source.limit * 0.5);
        }
      });

      // Enable aggressive caching
      optimized.aiConfiguration.cacheEnabled = true;
      optimized.aiConfiguration.cacheTTL = (optimized.aiConfiguration.cacheTTL || 3600) * 2;
    }

    return optimized;
  }

  private async getSystemLoad(): Promise<{ high: boolean }> {
    // This would check actual system metrics
    // For now, return mock data
    return { high: false };
  }

  // Get data requirements for a specific pipeline
  getDataRequirements(pipeline: string): DataRequirements | null {
    const decision = this.decisionTree[pipeline];
    return decision?.dataRequirements || null;
  }

  // Get recommended model for a use case
  getRecommendedModel(
    dataSize: number,
    complexity: 'low' | 'medium' | 'high',
    latencySensitive: boolean
  ): AIModel {
    if (latencySensitive || dataSize < 1000) {
      return 'gpt-3.5-turbo';
    }

    if (complexity === 'high' || dataSize > 10000) {
      return 'gpt-4-turbo-preview';
    }

    return 'gpt-3.5-turbo';
  }
}

export const aiDecisionManager = AIDecisionManager.getInstance();