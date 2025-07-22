// lib/ai/framework/cache.ts
import { createHash } from 'crypto';
import { logger } from '@/lib/utils/logger';

interface CacheEntry {
  key: string;
  value: any;
  expiresAt: number;
  createdAt: number;
  hits: number;
  lastAccessed: number;
}

export class AICache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 1000; // Maximum cache entries
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  generateKey(prompt: string, params?: Record<string, any>): string {
    const content = JSON.stringify({ prompt, ...params });
    return createHash('sha256').update(content).digest('hex');
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      logger.debug('AI_CACHE', 'CACHE_MISS', { key });
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug('AI_CACHE', 'CACHE_EXPIRED', { key });
      return null;
    }

    // Update stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    logger.debug('AI_CACHE', 'CACHE_HIT', { 
      key, 
      hits: entry.hits,
      age: Math.round((Date.now() - entry.createdAt) / 1000) + 's'
    });

    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      key,
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);

    logger.debug('AI_CACHE', 'CACHE_SET', { 
      key, 
      ttl: ttlSeconds,
      size: this.cache.size 
    });
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    // Find least recently used entry
    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.debug('AI_CACHE', 'CACHE_EVICTED', { key: oldestKey });
    }
  }

  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('AI_CACHE', 'CACHE_CLEARED', { entriesCleared: size });
  }

  async getStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    topEntries: Array<{
      key: string;
      hits: number;
      age: string;
    }>;
  }> {
    const topEntries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, 10)
      .map(([key, entry]) => ({
        key: key.substring(0, 8) + '...',
        hits: entry.hits,
        age: Math.round((Date.now() - entry.createdAt) / 60000) + 'm'
      }));

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      evictions: this.stats.evictions,
      topEntries
    };
  }

  // Cleanup expired entries (run periodically)
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info('AI_CACHE', 'CLEANUP_COMPLETED', { entriesCleaned: cleaned });
    }
  }

  // Advanced cache patterns
  async getOrSet(
    key: string, 
    factory: () => Promise<any>, 
    ttlSeconds: number
  ): Promise<any> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  // Invalidate cache entries by pattern
  async invalidatePattern(pattern: string): Promise<number> {
    let invalidated = 0;
    
    this.cache.forEach((entry, key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    });

    logger.info('AI_CACHE', 'PATTERN_INVALIDATED', { pattern, count: invalidated });
    return invalidated;
  }
}