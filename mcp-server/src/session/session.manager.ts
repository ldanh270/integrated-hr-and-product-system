import { v4 as uuidv4 } from "uuid"

import { AuthInfo, SessionData } from "../types/session.types.js"

export class SessionManager {
  private sessions = new Map<string, SessionData>()

  // Default session time-to-live (e.g., 8 hours, matching the refresh token)
  private readonly DEFAULT_TTL = 8 * 60 * 60 * 1000

  constructor() {
    // Automatically clean up expired sessions every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000)
  }

  public create(authInfo: AuthInfo): string {
    const sessionId = `session-${uuidv4()}`
    const expiresAt = Date.now() + this.DEFAULT_TTL

    this.sessions.set(sessionId, {
      ...authInfo,
      expiresAt,
    })

    return sessionId
  }

  public get(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId)

    // Check if the session has expired
    if (session && session.expiresAt < Date.now()) {
      this.delete(sessionId)
      return undefined
    }

    return session
  }

  public delete(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id)
      }
    }
  }
}

// Global instance (Singleton)
export const sessionManager = new SessionManager()
