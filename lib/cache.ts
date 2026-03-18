import { Redis } from '@upstash/redis';
import { CacheConfig } from './smartolt-types';

export interface CacheProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;
}

export class RedisCacheProvider implements CacheProvider {
  private redis: Redis;
  private defaultTTL: number;

  constructor(redisUrl?: string, redisToken?: string, defaultTTL: number = 60) {
    this.defaultTTL = defaultTTL;

    if (redisUrl && redisToken) {
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } else {
      // Fallback to environment variables
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttl });
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[Cache] Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[Cache] Redis exists error:', error);
      return false;
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Clear all cache keys with our prefix
        const keys = await this.redis.keys('smartolt:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('[Cache] Redis clear error:', error);
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('[Cache] Redis TTL error:', error);
      return -1;
    }
  }
}

export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, { value: string; expires: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60) {
    this.defaultTTL = defaultTTL;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl: number = this.defaultTTL): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export class CacheManager {
  private provider: CacheProvider;
  private defaultConfig: CacheConfig;

  constructor(provider: CacheProvider, defaultConfig: Partial<CacheConfig> = {}) {
    this.provider = provider;
    this.defaultConfig = {
      ttl: 60,
      stale_while_revalidate: true,
      background_refetch: true,
      ...defaultConfig,
    };
  }

  private generateKey(prefix: string, identifier: string): string {
    return `smartolt:${prefix}:${identifier}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.provider.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, config?: Partial<CacheConfig>): Promise<void> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      await this.provider.set(key, JSON.stringify(data), finalConfig.ttl);
    } catch (error) {
      console.error('[Cache] Set error:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) {
      const finalConfig = { ...this.defaultConfig, ...config };

      // Background refetch if stale-while-revalidate is enabled
      if (finalConfig.background_refetch && finalConfig.stale_while_revalidate) {
        // Trigger background refetch without waiting
        fetcher()
          .then(freshData => this.set(key, freshData, config))
          .catch(error => {
            console.error('[Cache] Background refetch error:', error);
          });
      }

      return cached;
    }

    // No cache hit, fetch fresh data
    try {
      const freshData = await fetcher();
      await this.set(key, freshData, config);
      return freshData;
    } catch (error) {
      console.error('[Cache] Fetch error:', error);
      throw error;
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.provider.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.provider.clear(pattern);
  }

  // SmartOLT specific cache helpers
  async getCachedOLTs(): Promise<any[] | null> {
    return this.get(this.generateKey('olts', 'list'));
  }

  async setCachedOLTs(olts: any[], ttl?: number): Promise<void> {
    await this.set(this.generateKey('olts', 'list'), olts, { ttl });
  }

  async getCachedONUs(oltId?: string): Promise<any[] | null> {
    const key = oltId ? `onus:${oltId}` : 'onus:all';
    return this.get(this.generateKey('onus', key));
  }

  async setCachedONUs(onus: any[], oltId?: string, ttl?: number): Promise<void> {
    const key = oltId ? `onus:${oltId}` : 'onus:all';
    await this.set(this.generateKey('onus', key), onus, { ttl });
  }

  async getCachedAlerts(): Promise<any[] | null> {
    return this.get(this.generateKey('alerts', 'active'));
  }

  async setCachedAlerts(alerts: any[], ttl?: number): Promise<void> {
    await this.set(this.generateKey('alerts', 'active'), alerts, { ttl });
  }

  async getCachedMetrics(): Promise<any | null> {
    return this.get(this.generateKey('metrics', 'dashboard'));
  }

  async setCachedMetrics(metrics: any, ttl?: number): Promise<void> {
    await this.set(this.generateKey('metrics', 'dashboard'), metrics, { ttl });
  }

  // Invalidate all SmartOLT cache
  async clearSmartOLTCache(): Promise<void> {
    await this.provider.clear('smartolt:*');
  }
}

// Create singleton instances
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    // Try to use Redis if available, otherwise fallback to memory
    const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    if (hasRedis) {
      const provider = new RedisCacheProvider();
      cacheManager = new CacheManager(provider);
    } else {
      const provider = new MemoryCacheProvider();
      cacheManager = new CacheManager(provider);
    }
  }

  return cacheManager;
}

export function createCacheManager(provider: CacheProvider, config?: Partial<CacheConfig>): CacheManager {
  return new CacheManager(provider, config);
}