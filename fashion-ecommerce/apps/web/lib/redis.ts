import Redis from 'ioredis';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client instance
 * Creates a new connection if one doesn't exist
 */
export function getRedisClient(): Redis | null {
  // Only create Redis client on server-side
  if (typeof window !== 'undefined') {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('error', (err) => {
      // In development, Redis is optional for caching
      // Only log as warning if connection is refused (likely Redis not started)
      if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  Redis not available - app will work without caching. Start Redis with: npm run docker:up');
        } else {
          console.error('Redis Client Error:', err);
        }
      } else {
        console.error('Redis Client Error:', err);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Cache utility functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL (time to live in seconds)
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    if (!client) return 0;

    try {
      const stream = client.scanStream({
        match: pattern,
        count: 100,
      });

      const keys: string[] = [];

      // Collect all keys
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });

      // Delete all keys
      if (keys.length > 0) {
        const deletedCount = await client.del(...keys);
        return deletedCount;
      }

      return 0;
    } catch (error) {
      console.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
    }
  },
};

/**
 * Generate cache key for API routes
 */
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

