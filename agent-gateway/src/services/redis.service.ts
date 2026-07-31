import { type CoreMessage } from "ai"
import { Redis } from "ioredis"

import { env } from "../config/env.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SessionData {
  sessionId: string
  expiresAt: number
}

// ---------------------------------------------------------------------------
// Redis Key Builders
// ---------------------------------------------------------------------------
const KEYS = {
  session: (userId: string) => `session:${userId}`,
  history: (userId: string) => `history:${userId}`,
  pendingLogin: (userId: string) => `login_poll:${userId}`,
  rateLimit: (userId: string) => `rate_limit:${userId}`,
} as const

// ---------------------------------------------------------------------------
// TTLs (seconds)
// ---------------------------------------------------------------------------
const TTL = {
  SESSION: 8 * 60 * 60,     // 8 hours — matches MCP SessionManager DEFAULT_TTL
  HISTORY: 24 * 60 * 60,    // 24 hours — auto-clear stale context
  PENDING_LOGIN: 5 * 60,    // 5 minutes — login must complete within this window
  RATE_LIMIT: 1,            // 1 second — 1 msg/s per user
} as const

// Max messages to keep in history (older ones are trimmed)
const MAX_HISTORY_MESSAGES = 20

// ---------------------------------------------------------------------------
// IRedisService Interface
// ---------------------------------------------------------------------------
export interface IRedisService {
  // Session
  getSession(userId: string): Promise<SessionData | null>
  setSession(userId: string, sessionId: string): Promise<void>
  deleteSession(userId: string): Promise<void>

  // Chat history
  getHistory(userId: string): Promise<CoreMessage[]>
  appendHistory(userId: string, messages: CoreMessage[]): Promise<void>
  clearHistory(userId: string): Promise<void>

  // Login polling
  getPendingLogin(userId: string): Promise<string | null>
  setPendingLogin(userId: string, loginId: string): Promise<void>
  deletePendingLogin(userId: string): Promise<void>

  // Rate limiting
  checkRateLimit(userId: string): Promise<boolean>

  // Lifecycle
  ping(): Promise<void>
  quit(): Promise<void>
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------
class RedisService implements IRedisService {
  private readonly client: Redis

  constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.client.on("error", (err: Error) => {
      console.error("[Redis] Connection error:", err.message)
    })
  }

  // --- Session ---

  async getSession(userId: string): Promise<SessionData | null> {
    const raw = await this.client.get(KEYS.session(userId))
    if (!raw) return null

    const data = JSON.parse(raw) as SessionData

    // Double-check expiry locally (belt-and-suspenders with Redis TTL)
    if (data.expiresAt < Date.now()) {
      await this.deleteSession(userId)
      return null
    }

    return data
  }

  async setSession(userId: string, sessionId: string): Promise<void> {
    const expiresAt = Date.now() + TTL.SESSION * 1000
    const payload: SessionData = { sessionId, expiresAt }
    await this.client.set(KEYS.session(userId), JSON.stringify(payload), "EX", TTL.SESSION)
  }

  async deleteSession(userId: string): Promise<void> {
    await this.client.del(KEYS.session(userId))
  }

  // --- History ---

  async getHistory(userId: string): Promise<CoreMessage[]> {
    const raw = await this.client.get(KEYS.history(userId))
    if (!raw) return []
    return JSON.parse(raw) as CoreMessage[]
  }

  async appendHistory(userId: string, messages: CoreMessage[]): Promise<void> {
    const existing = await this.getHistory(userId)
    const combined = [...existing, ...messages]

    // Keep only the last N messages to avoid unbounded growth
    const trimmed = combined.slice(-MAX_HISTORY_MESSAGES)

    await this.client.set(KEYS.history(userId), JSON.stringify(trimmed), "EX", TTL.HISTORY)
  }

  async clearHistory(userId: string): Promise<void> {
    await this.client.del(KEYS.history(userId))
  }

  // --- Login polling ---

  async getPendingLogin(userId: string): Promise<string | null> {
    return this.client.get(KEYS.pendingLogin(userId))
  }

  async setPendingLogin(userId: string, loginId: string): Promise<void> {
    await this.client.set(KEYS.pendingLogin(userId), loginId, "EX", TTL.PENDING_LOGIN)
  }

  async deletePendingLogin(userId: string): Promise<void> {
    await this.client.del(KEYS.pendingLogin(userId))
  }

  // --- Rate limiting ---

  /**
   * Returns `true` if the user is allowed to send a message (not rate-limited).
   * Uses atomic INCR + EXPIRE: allows 1 message per TTL.RATE_LIMIT seconds.
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    const key = KEYS.rateLimit(userId)
    const count = await this.client.incr(key)
    if (count === 1) {
      await this.client.expire(key, TTL.RATE_LIMIT)
    }
    return count <= 1
  }

  // --- Lifecycle ---

  async ping(): Promise<void> {
    await this.client.ping()
  }

  async quit(): Promise<void> {
    await this.client.quit()
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------
export const redisService: IRedisService = new RedisService()
