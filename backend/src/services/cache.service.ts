import Redis from "ioredis"
import { EventEmitter } from "events"
import { ICacheService } from "../types/index.ts"

interface CacheEntry {
  value: any
  expiresAt: number | null
}

export class InMemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry>()
  private emitter = new EventEmitter()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.emitter.on(channel, callback)
  }

  async publish(channel: string, message: string): Promise<void> {
    this.emitter.emit(channel, message)
  }
}

export class RedisCacheService implements ICacheService {
  private client: Redis | null = null
  private subClient: Redis | null = null
  private fallbackMemory = new InMemoryCacheService()
  private isRedisAvailable = false
  private connectionString: string

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
export function createCacheService(): ICacheService {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    return new RedisCacheService(redisUrl)
  }
  return new InMemoryCacheService()
}

export const cacheService = createCacheService()

