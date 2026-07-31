import express from "express"

import { env } from "./config/env.js"
import { redisService } from "./services/redis.service.js"
import { mcpService } from "./services/mcp.service.js"
import { createBot } from "./bot/index.js"

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`[App] Starting HRP Agent Gateway (${env.NODE_ENV})...`)

  // 1. Verify Redis connection
  try {
    await redisService.ping()
    console.log("[App] ✅ Redis connected")
  } catch (err) {
    console.error("[App] ❌ Redis connection failed:", err)
    process.exit(1)
  }

  // 2. Verify MCP Server connectivity by fetching tools
  try {
    const tools = await mcpService.getTools()
    console.log(`[App] ✅ MCP Server connected — ${tools.length} tools available`)
  } catch (err) {
    console.error("[App] ❌ MCP Server connection failed:", err)
    console.error("[App] Ensure MCP_SSE_URL is correct and mcp-server is running.")
    process.exit(1)
  }

  // 3. Start bot
  const bot = createBot()

  // 4. Small Express server for health checks
  const app = express()
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "hrp-agent-gateway", timestamp: new Date().toISOString() })
  })
  app.listen(env.PORT, () => {
    console.log(`[App] ✅ Health check server running on port ${env.PORT}`)
  })

  // 5. Launch bot
  await bot.launch({
    allowedUpdates: ["message", "callback_query"],
  })
  console.log("[App] ✅ Telegram bot is running (long polling)")

  // 6. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[App] Received ${signal}, shutting down gracefully...`)
    bot.stop(signal)
    await redisService.quit()
    process.exit(0)
  }

  process.once("SIGINT", () => shutdown("SIGINT"))
  process.once("SIGTERM", () => shutdown("SIGTERM"))
}

main().catch((err) => {
  console.error("[App] Fatal startup error:", err)
  process.exit(1)
})
