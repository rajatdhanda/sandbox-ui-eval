// lib/ai/framework/rate-limiter.ts
import { logger } from '@/lib/utils/logger';

export type RateLimitTier = 'quick' | 'analysis' | 'report';

interface RateLimitConfig {
  tier: RateLimitTier;
  maxPerHour: number;
  maxPerMinute: number;
}

interface UserUsage {
  userId: string;
  tier: RateLimitTier;
  hourlyCount: number;
  minuteCount: number;
  hourStart: number;
  minuteStart: number;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public tier: RateLimitTier,
    public resetTime: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RateLimiter {
  private limits: Record<RateLimitTier, RateLimitConfig> = {
    quick: { tier: 'quick', maxPerHour: 100, maxPerMinute: 10 },
    analysis: { tier: 'analysis', maxPerHour: 20, maxPerMinute: 2 },
    report: { tier: 'report', maxPerHour: 5, maxPerMinute: 1 }
  };

  private usage: Map<string, UserUsage> = new Map();

  async checkLimit(userId: string, tier: RateLimitTier): Promise<boolean> {
    const key = `${userId}:${tier}`;
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    let userUsage = this.usage.get(key);

    if (!userUsage) {
      userUsage = {
        userId,
        tier,
        hourlyCount: 0,
        minuteCount: 0,
        hourStart: currentHour,
        minuteStart: currentMinute
      };
      this.usage.set(key, userUsage);
    }

    // Reset counters if time windows have passed
    if (currentHour !== userUsage.hourStart) {
      userUsage.hourlyCount = 0;
      userUsage.hourStart = currentHour;
    }

    if (currentMinute !== userUsage.minuteStart) {
      userUsage.minuteCount = 0;
      userUsage.minuteStart = currentMinute;
    }

    const limit = this.limits[tier];

    // Check minute limit
    if (userUsage.minuteCount >= limit.maxPerMinute) {
      const resetTime = new Date((userUsage.minuteStart + 1) * 60000);
      logger.warn('RATE_LIMITER', 'MINUTE_LIMIT_EXCEEDED', {
        userId,
        tier,
        limit: limit.maxPerMinute,
        current: userUsage.minuteCount,
        resetTime
      });
      
      throw new RateLimitError(
        `Rate limit exceeded: ${limit.maxPerMinute} requests per minute for ${tier} tier`,
        tier,
        resetTime
      );
    }

    // Check hourly limit
    if (userUsage.hourlyCount >= limit.maxPerHour) {
      const resetTime = new Date((userUsage.hourStart + 1) * 3600000);
      logger.warn('RATE_LIMITER', 'HOUR_LIMIT_EXCEEDED', {
        userId,
        tier,
        limit: limit.maxPerHour,
        current: userUsage.hourlyCount,
        resetTime
      });
      
      throw new RateLimitError(
        `Rate limit exceeded: ${limit.maxPerHour} requests per hour for ${tier} tier`,
        tier,
        resetTime
      );
    }

    return true;
  }

  async incrementUsage(userId: string, tier: RateLimitTier): Promise<void> {
    const key = `${userId}:${tier}`;
    const userUsage = this.usage.get(key);

    if (!userUsage) {
      throw new Error('Usage not found - checkLimit must be called first');
    }

    userUsage.hourlyCount++;
    userUsage.minuteCount++;

    logger.debug('RATE_LIMITER', 'USAGE_INCREMENTED', {
      userId,
      tier,
      hourly: userUsage.hourlyCount,
      minute: userUsage.minuteCount
    });
  }

  async getRemainingQuota(userId: string, tier: RateLimitTier): Promise<{
    hourly: number;
    minute: number;
    resetMinute: Date;
    resetHour: Date;
  }> {
    const key = `${userId}:${tier}`;
    const userUsage = this.usage.get(key);
    const limit = this.limits[tier];

    if (!userUsage) {
      return {
        hourly: limit.maxPerHour,
        minute: limit.maxPerMinute,
        resetMinute: new Date(Date.now() + 60000),
        resetHour: new Date(Date.now() + 3600000)
      };
    }

    return {
      hourly: Math.max(0, limit.maxPerHour - userUsage.hourlyCount),
      minute: Math.max(0, limit.maxPerMinute - userUsage.minuteCount),
      resetMinute: new Date((userUsage.minuteStart + 1) * 60000),
      resetHour: new Date((userUsage.hourStart + 1) * 3600000)
    };
  }

  async resetUserLimits(userId: string, tier?: RateLimitTier): Promise<void> {
    if (tier) {
      this.usage.delete(`${userId}:${tier}`);
    } else {
      // Reset all tiers for user
      for (const t of Object.keys(this.limits) as RateLimitTier[]) {
        this.usage.delete(`${userId}:${t}`);
      }
    }

    logger.info('RATE_LIMITER', 'USER_LIMITS_RESET', { userId, tier });
  }

  // Admin methods
  updateLimit(tier: RateLimitTier, config: Partial<RateLimitConfig>): void {
    this.limits[tier] = {
      ...this.limits[tier],
      ...config
    };

    logger.info('RATE_LIMITER', 'LIMIT_UPDATED', { tier, config });
  }

  async getStats(): Promise<{
    activeUsers: number;
    usageByTier: Record<RateLimitTier, number>;
    topUsers: Array<{ userId: string; usage: number }>;
  }> {
    const stats = {
      activeUsers: new Set<string>(),
      usageByTier: { quick: 0, analysis: 0, report: 0 } as Record<RateLimitTier, number>,
      topUsers: new Map<string, number>()
    };

    this.usage.forEach((usage, key) => {
      stats.activeUsers.add(usage.userId);
      stats.usageByTier[usage.tier] += usage.hourlyCount;
      
      const currentUsage = stats.topUsers.get(usage.userId) || 0;
      stats.topUsers.set(usage.userId, currentUsage + usage.hourlyCount);
    });

    const topUsersList = Array.from(stats.topUsers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, usage]) => ({ userId, usage }));

    return {
      activeUsers: stats.activeUsers.size,
      usageByTier: stats.usageByTier,
      topUsers: topUsersList
    };
  }

  // Cleanup old usage data (run periodically)
  cleanup(): void {
    const now = Date.now();
    const currentHour = Math.floor(now / 3600000);

    this.usage.forEach((usage, key) => {
      if (currentHour - usage.hourStart > 1) {
        this.usage.delete(key);
      }
    });
  }
}