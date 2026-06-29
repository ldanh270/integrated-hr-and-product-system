import { v4 as uuidv4 } from "uuid";

export type LoginStatus = "pending" | "completed" | "failed";

export interface LoginRequest {
  id: string;
  status: LoginStatus;
  sessionId?: string;
  error?: string;
  expiresAt: number;
}

class LoginStore {
  private requests = new Map<string, LoginRequest>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Cleanup expired requests every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  public create(): string {
    const id = `login-${uuidv4()}`;
    this.requests.set(id, {
      id,
      status: "pending",
      expiresAt: Date.now() + this.TTL,
    });
    return id;
  }

  public get(id: string): LoginRequest | undefined {
    const req = this.requests.get(id);
    if (req && req.expiresAt < Date.now()) {
      this.requests.delete(id);
      return undefined;
    }
    return req;
  }

  public setCompleted(id: string, sessionId: string): void {
    const req = this.get(id);
    if (req) {
      req.status = "completed";
      req.sessionId = sessionId;
      this.requests.set(id, req);
    }
  }

  public setFailed(id: string, error: string): void {
    const req = this.get(id);
    if (req) {
      req.status = "failed";
      req.error = error;
      this.requests.set(id, req);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, req] of this.requests.entries()) {
      if (req.expiresAt < now) {
        this.requests.delete(id);
      }
    }
  }
}

export const loginStore = new LoginStore();
