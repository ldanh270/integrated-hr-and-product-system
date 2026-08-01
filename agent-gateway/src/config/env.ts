import "dotenv/config"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const EnvSchema = z.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),

  // 9Router / LLM
  NINE_ROUTER_BASE_URL: z.string().url("NINE_ROUTER_BASE_URL must be a valid URL"),
  NINE_ROUTER_API_KEY: z.string().min(1, "NINE_ROUTER_API_KEY is required"),
  NINE_ROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),

  // MCP Server
  MCP_SSE_URL: z.string().url("MCP_SSE_URL must be a valid URL"),
  MCP_MESSAGE_URL: z.string().url("MCP_MESSAGE_URL must be a valid URL"),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3002),
  AGENT_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
})

// ---------------------------------------------------------------------------
// Parse & fail-fast
// ---------------------------------------------------------------------------
const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:")
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

export type Env = typeof parsed.data
