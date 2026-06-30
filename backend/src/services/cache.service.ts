import Redis from "ioredis"
import { EventEmitter } from "events"
import { ICacheService } from "../types/index.ts"

interface CacheEntry {
  value: any
  expiresAt: number | null
}

/**
 * In-memory cache service used for local key-value storage and lightweight pub/sub.
 */
export class InMemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry>()
  private emitter = new EventEmitter()

  /**
   * Retrieves a cached value from in-memory storage when it exists and is not expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  /**
   * Stores a value in in-memory cache with an optional TTL.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Removes a single cached entry from in-memory storage.
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clears all entries from in-memory cache storage.
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Registers an in-memory subscriber for a cache channel.
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.emitter.on(channel, callback)
  }

  /**
   * Publishes a message to in-memory subscribers for a cache channel.
   */
  async publish(channel: string, message: string): Promise<void> {
    this.emitter.emit(channel, message)
  }
}

/**
 * Redis-backed cache service with automatic fallback to in-memory storage when Redis is unavailable.
 */
export class RedisCacheService implements ICacheService {
  private client: Redis | null = null
  private subClient: Redis | null = null
  private fallbackMemory = new InMemoryCacheService()
  private isRedisAvailable = false
  private connectionString: string

  /**
   * Initializes Redis clients and prepares in-memory fallback behavior.
   */
  constructor(connectionString: string) {
    this.connectionString = connectionString
    try {
      this.client = new Redis(connectionString, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        reconnectOnError: () => false,
      })

      this.client.on("connect", () => {
        console.log("Redis connected successfully")
        this.isRedisAvailable = true
      })

      this.client.on("error", (err) => {
        console.warn("Redis connection error, falling back to in-memory:", err.message)
        this.isRedisAvailable = false
      })
    } catch (err) {
      console.warn("Failed to initialize Redis client, falling back to in-memory:", err)
      this.isRedisAvailable = false
    }
  }

  /**
   * Retrieves a cached value from Redis, with fallback to in-memory storage when needed.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable || !this.client) {
      return this.fallbackMemory.get<T>(key)
    }
    let data: string | null = null
    try {
      data = await this.client.get(key)
    } catch (err) {
      console.warn(`Redis get failed for key ${key}, falling back to memory:`, err)
      return this.fallbackMemory.get<T>(key)
    }

    if (!data) return null

    try {
      return JSON.parse(data) as T
    } catch (err) {
      console.warn(`Redis cache corrupted (JSON.parse failed) for key ${key}, invalidating:`, err)
      await this.del(key)
      return null
    }
  }

  /**
   * Stores a value in Redis and keeps the in-memory fallback synchronized.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Keep local fallback updated
    await this.fallbackMemory.set<T>(key, value, ttlSeconds)

    if (!this.isRedisAvailable || !this.client) {
      return
    }
    try {
      const data = JSON.stringify(value)
      if (ttlSeconds) {
        await this.client.set(key, data, "EX", ttlSeconds)
      } else {
        await this.client.set(key, data)
      }
    } catch (err) {
      console.warn(`Redis set failed for key ${key}:`, err)
    }
  }

  /**
   * Deletes a cached entry from Redis and the in-memory fallback.
   */
  async del(key: string): Promise<void> {
    await this.fallbackMemory.del(key)

    if (!this.isRedisAvailable || !this.client) {
      return
    }
    try {
      await this.client.del(key)
    } catch (err) {
      console.warn(`Redis del failed for key ${key}:`, err)
    }
  }

  /**
   * Clears all cached data from Redis and the in-memory fallback.
   */
  async clear(): Promise<void> {
    await this.fallbackMemory.clear()

    if (!this.isRedisAvailable || !this.client) {
      return
    }
    try {
      await this.client.flushdb()
    } catch (err) {
      console.warn(`Redis clear failed:`, err)
    }
  }

  /**
   * Subscribes to a pub/sub channel using Redis with in-memory fallback support.
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.fallbackMemory.subscribe(channel, callback)

    if (!this.isRedisAvailable || !this.client) {
      return
    }
    try {
      if (!this.subClient) {
        this.subClient = new Redis(this.connectionString, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
        })
        this.subClient.on("error", (err) => {
          console.warn("Redis pubsub client error:", err.message)
        })
        this.subClient.on("message", (chan, msg) => {
          if (chan === channel) {
            callback(msg)
          }
        })
      }
      await this.subClient.subscribe(channel)
    } catch (err) {
      console.warn(`Redis subscribe failed for channel ${channel}:`, err)
    }
  }

  /**
   * Publishes a pub/sub message through Redis and the in-memory fallback.
   */
  async publish(channel: string, message: string): Promise<void> {
    await this.fallbackMemory.publish(channel, message)

    if (!this.isRedisAvailable || !this.client) {
      return
    }
    try {
      await this.client.publish(channel, message)
    } catch (err) {
      console.warn(`Redis publish failed for channel ${channel}:`, err)
    }
  }
}

// Global cache service factory helper based on environment variable
/**
 * Creates the active cache service implementation based on runtime configuration.
 */
export function createCacheService(): ICacheService {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    return new RedisCacheService(redisUrl)
  }
  return new InMemoryCacheService()
}

export const cacheService = createCacheService()

