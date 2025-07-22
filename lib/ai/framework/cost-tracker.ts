// lib/ai/framework/cost-tracker.ts
import { logger } from '@/lib/utils/logger';
import type { AIModel } from '../types';

interface UsageRecord {
  userId: string;
  timestamp: number;
  model: AIModel;
  tokens: number;
  cost: number;
  endpoint?: string;
  success: boolean;
}

interface ModelPricing {
  model: AIModel;
  pricePerThousandTokens: number;
}

export class CostTracker {
  private usage: UsageRecord[] = [];
  
  private pricing: Record<AIModel, ModelPricing> = {
    'gpt-3.5-turbo': { model: 'gpt-3.5-turbo', pricePerThousandTokens: 0.002 },
    'gpt-4': { model: 'gpt-4', pricePerThousandTokens: 0.03 },
    'gpt-4-turbo-preview': { model: 'gpt-4-turbo-preview', pricePerThousandTokens: 0.01 }
  };

  async trackUsage(
    userId: string,
    model: AIModel,
    tokens: number,
    endpoint?: string,
    success: boolean = true
  ): Promise<void> {
    const cost = this.calculateCost(model, tokens);
    
    const record: UsageRecord = {
      userId,
      timestamp: Date.now(),
      model,
      tokens,
      cost,
      endpoint,
      success
    };

    this.usage.push(record);

    // Keep only last 30 days of data in memory
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.usage = this.usage.filter(r => r.timestamp > thirtyDaysAgo);

    logger.info('COST_TRACKER', 'USAGE_TRACKED', {
      userId,
      model,
      tokens,
      cost: `$${cost.toFixed(4)}`,
      totalUserCost: await this.getUserTotalCost(userId)
    });

    // Alert if high usage
    if (cost > 1.0) {
      logger.warn('COST_TRACKER', 'HIGH_COST_USAGE', {
        userId,
        model,
        tokens,
        cost: `$${cost.toFixed(2)}`
      });
    }
  }

  private calculateCost(model: AIModel, tokens: number): number {
    const pricing = this.pricing[model];
    if (!pricing) {
      logger.warn('COST_TRACKER', 'UNKNOWN_MODEL_PRICING', { model });
      return 0;
    }

    return (tokens / 1000) * pricing.pricePerThousandTokens;
  }

  async getUserUsage(
    userId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    byModel: Record<string, { tokens: number; cost: number; count: number }>;
    timeline: Array<{ timestamp: number; cost: number }>;
  }> {
    const now = Date.now();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - periodMs[period];
    const userRecords = this.usage.filter(
      r => r.userId === userId && r.timestamp > cutoff
    );

    const byModel: Record<string, { tokens: number; cost: number; count: number }> = {};
    let totalCost = 0;
    let totalTokens = 0;

    userRecords.forEach(record => {
      totalCost += record.cost;
      totalTokens += record.tokens;

      if (!byModel[record.model]) {
        byModel[record.model] = { tokens: 0, cost: 0, count: 0 };
      }

      byModel[record.model].tokens += record.tokens;
      byModel[record.model].cost += record.cost;
      byModel[record.model].count += 1;
    });

    // Create timeline for charts
    const timeline = userRecords.map(r => ({
      timestamp: r.timestamp,
      cost: r.cost
    }));

    return {
      totalCost,
      totalTokens,
      requestCount: userRecords.length,
      byModel,
      timeline
    };
  }

  async getUserTotalCost(userId: string): Promise<number> {
    return this.usage
      .filter(r => r.userId === userId)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  async getStats(): Promise<{
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    averageCostPerRequest: number;
    topUsers: Array<{ userId: string; cost: number; requests: number }>;
    costByModel: Record<string, number>;
    successRate: number;
  }> {
    const userCosts = new Map<string, { cost: number; requests: number }>();
    const costByModel: Record<string, number> = {};
    let totalCost = 0;
    let totalTokens = 0;
    let successCount = 0;

    this.usage.forEach(record => {
      totalCost += record.cost;
      totalTokens += record.tokens;
      
      if (record.success) successCount++;

      // User aggregation
      const current = userCosts.get(record.userId) || { cost: 0, requests: 0 };
      current.cost += record.cost;
      current.requests += 1;
      userCosts.set(record.userId, current);

      // Model aggregation
      costByModel[record.model] = (costByModel[record.model] || 0) + record.cost;
    });

    const topUsers = Array.from(userCosts.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      totalCost,
      totalTokens,
      totalRequests: this.usage.length,
      averageCostPerRequest: this.usage.length > 0 ? totalCost / this.usage.length : 0,
      topUsers,
      costByModel,
      successRate: this.usage.length > 0 ? (successCount / this.usage.length) * 100 : 100
    };
  }

  // Budget management
  async checkBudget(userId: string, monthlyBudget: number): Promise<{
    spent: number;
    remaining: number;
    percentUsed: number;
    projectedMonthly: number;
    withinBudget: boolean;
  }> {
    const { totalCost } = await this.getUserUsage(userId, 'month');
    const daysIntoMonth = new Date().getDate();
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();

    const projectedMonthly = (totalCost / daysIntoMonth) * daysInMonth;
    const percentUsed = (totalCost / monthlyBudget) * 100;

    return {
      spent: totalCost,
      remaining: Math.max(0, monthlyBudget - totalCost),
      percentUsed: Math.round(percentUsed * 100) / 100,
      projectedMonthly,
      withinBudget: totalCost < monthlyBudget
    };
  }

  // Export data for analysis
  exportUsageData(userId?: string, format: 'json' | 'csv' = 'json'): string {
    const data = userId 
      ? this.usage.filter(r => r.userId === userId)
      : this.usage;

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = ['timestamp', 'userId', 'model', 'tokens', 'cost', 'endpoint', 'success'];
    const rows = data.map(r => [
      new Date(r.timestamp).toISOString(),
      r.userId,
      r.model,
      r.tokens,
      r.cost.toFixed(4),
      r.endpoint || '',
      r.success
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}