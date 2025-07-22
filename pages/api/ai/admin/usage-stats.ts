// pages/api/ai/admin/usage-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../middleware/auth';
import { aiGateway } from '@/lib/ai/framework/gateway';
import { logger } from '@/lib/utils/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { period = 'day', userId } = req.query;
      
      // Get components from gateway
      const costTracker = (aiGateway as any).costTracker;
      const rateLimiter = (aiGateway as any).rateLimiter;
      const cache = (aiGateway as any).cache;

      // Get overall stats
      const costStats = await costTracker.getStats();
      const rateLimitStats = await rateLimiter.getStats();
      const cacheStats = await cache.getStats();

      // Get specific user stats if requested
      let userStats = null;
      if (userId && typeof userId === 'string') {
        userStats = await costTracker.getUserUsage(
          userId, 
          period as 'hour' | 'day' | 'week' | 'month'
        );
      }

      const response = {
        overview: {
          totalCost: `$${costStats.totalCost.toFixed(2)}`,
          totalRequests: costStats.totalRequests,
          totalTokens: costStats.totalTokens,
          averageCostPerRequest: `$${costStats.averageCostPerRequest.toFixed(4)}`,
          successRate: `${costStats.successRate.toFixed(1)}%`,
          activeUsers: rateLimitStats.activeUsers
        },
        costByModel: Object.entries(costStats.costByModel).map(([model, cost]) => ({
          model,
          cost: `$${(cost as number).toFixed(2)}`
        })),
        topUsers: costStats.topUsers.map(user => ({
          ...user,
          cost: `$${user.cost.toFixed(2)}`
        })),
        rateLimit: {
          usageByTier: rateLimitStats.usageByTier,
          topUsers: rateLimitStats.topUsers
        },
        cache: {
          size: cacheStats.size,
          hitRate: `${cacheStats.hitRate}%`,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          evictions: cacheStats.evictions
        },
        userStats,
        timestamp: new Date().toISOString()
      };

      logger.info('AI_ADMIN', 'USAGE_STATS_RETRIEVED', {
        period,
        userId
      });

      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error('AI_ADMIN', 'USAGE_STATS_ERROR', error);
      
      res.status(500).json({
        error: 'Failed to retrieve usage stats',
        message: error.message
      });
    }
  } else if (req.method === 'POST') {
    // Export usage data
    try {
      const { format = 'json', userId } = req.body;
      const costTracker = (aiGateway as any).costTracker;
      
      const data = costTracker.exportUsageData(userId, format);
      
      res.setHeader(
        'Content-Type', 
        format === 'csv' ? 'text/csv' : 'application/json'
      );
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=ai-usage-${Date.now()}.${format}`
      );
      
      res.status(200).send(data);
      
    } catch (error: any) {
      logger.error('AI_ADMIN', 'EXPORT_ERROR', error);
      
      res.status(500).json({
        error: 'Failed to export usage data',
        message: error.message
      });
    }
  } else if (req.method === 'DELETE') {
    // Clear cache
    try {
      const cache = (aiGateway as any).cache;
      await cache.clear();
      
      logger.info('AI_ADMIN', 'CACHE_CLEARED');
      
      res.status(200).json({
        message: 'Cache cleared successfully'
      });
      
    } catch (error: any) {
      logger.error('AI_ADMIN', 'CACHE_CLEAR_ERROR', error);
      
      res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Only admins can access usage stats
export default withAuth(handler, { requireRole: ['admin'] });