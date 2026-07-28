import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { OAUTH_STATE_SECRET } from "@/configs/auth/auth.config"

const STATE_TTL_MS = 10 * 60 * 1000
const consumedNonces = new Map<string, number>()

export interface OAuthStatePayload {
  userId: string
  channel: string
  name: string
  accountId?: string
  nonce: string
  expiresAt: number
}

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url")
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const getSecret = () => {
  const secret = process.env.OAUTH_STATE_SECRET || OAUTH_STATE_SECRET
  if (!secret) throw new Error("OAuth state secret is not configured")
  return secret
}

const sign = (value: string) => createHmac("sha256", getSecret()).update(value).digest("base64url")

const cleanupConsumedNonces = (now: number) => {
  for (const [nonce, expiresAt] of consumedNonces) {
    if (expiresAt <= now) consumedNonces.delete(nonce)
  }
}

export function createOAuthState(input: Omit<OAuthStatePayload, "nonce" | "expiresAt">, now = Date.now()) {
  const payload: OAuthStatePayload = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    expiresAt: now + STATE_TTL_MS,
  }
  const encodedPayload = encode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function consumeOAuthState(state: string, now = Date.now()): OAuthStatePayload {
  cleanupConsumedNonces(now)
  const [encodedPayload, encodedSignature, ...extra] = state.split(".")
  if (!encodedPayload || !encodedSignature || extra.length > 0) {
    throw new Error("Invalid OAuth state format")
  }

  const expectedSignature = sign(encodedPayload)
  const actual = Buffer.from(encodedSignature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid OAuth state signature")
  }

  let payload: OAuthStatePayload
  try {
    payload = JSON.parse(decode(encodedPayload)) as OAuthStatePayload
  } catch {
    throw new Error("Invalid OAuth state payload")
  }

  if (!payload.userId || !payload.channel || !payload.name || !payload.nonce || payload.expiresAt <= now) {
    throw new Error("Expired OAuth state")
  }
  if (consumedNonces.has(payload.nonce)) {
    throw new Error("OAuth state has already been consumed")
  }

  consumedNonces.set(payload.nonce, payload.expiresAt)
  return payload
}
