import type { Context, MiddlewareFn } from "telegraf"

import { redisService } from "../services/redis.service.js"

/**
 * Rate limit middleware: allows 1 message per second per user.
 * Uses Redis atomic INCR to prevent race conditions.
 */
export const rateLimitMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = String(ctx.from?.id)
  if (!userId) return next()

  const allowed = await redisService.checkRateLimit(userId)

  if (!allowed) {
    // Silent drop — do not send any reply to avoid feedback loop on rapid messages.
    // Optionally reply once: await ctx.reply("⏱ Vui lòng chờ 1 giây.")
    return
  }

  return next()
}
