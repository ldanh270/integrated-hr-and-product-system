import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { OAUTH_CREDENTIAL_ENCRYPTION_KEY } from "@/configs/auth/auth.config"

const ALGORITHM = "aes-256-gcm"
const VERSION = "enc:v1"

function getKey(): Buffer {
  const key = Buffer.from(process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY || OAUTH_CREDENTIAL_ENCRYPTION_KEY, "base64")
  if (key.length !== 32) {
    throw new Error("OAUTH_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key")
  }
  return key
}

export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${VERSION}:${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`
}

export function decryptCredential(value: string): string {
  if (!value.startsWith(`${VERSION}:`)) return value
  const [, , ivValue, authTagValue, encryptedValue] = value.split(":")
  if (!ivValue || !authTagValue || !encryptedValue) throw new Error("Invalid encrypted credential format")

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivValue, "base64url"), { authTagLength: 16 })
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
