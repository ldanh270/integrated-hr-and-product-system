import type { CoreMessage } from "ai"
import type { Context } from "telegraf"

import { env } from "../config/env.js"
import { mcpService } from "../services/mcp.service.js"
import { redisService } from "../services/redis.service.js"
import { convertMcpToolsToAiSdk, generateAgentResponse } from "../services/llm.service.js"

// ---------------------------------------------------------------------------
// Main Agent Handler
// ---------------------------------------------------------------------------

/**
 * Processes a user text message through the full AI agent loop:
 * load history → call LLM with tools → execute MCP tools → save history → reply
 */
export async function handleAgentMessage(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id)
  const sessionId: string = ctx.state.sessionId
  const userText = (ctx as Context & { message: { text: string } }).message?.text

  if (!userText) return

  // 1. Show "typing..." while processing
  await ctx.sendChatAction("typing")

  // 2. Load history and append current user message
  const history = await redisService.getHistory(userId)
  const userMessage: CoreMessage = { role: "user", content: userText }
  const currentMessages: CoreMessage[] = [...history, userMessage]

  // 3. Get MCP tools and wrap them with sessionId injection + error handling
  const mcpTools = await mcpService.getTools()

  const aiTools = convertMcpToolsToAiSdk(mcpTools, async (toolName, toolArgs) => {
    const result = await mcpService.callTool(toolName, toolArgs, sessionId)

    if (!result.success) {
      // UNAUTHORIZED: session expired
      if (result.code === "UNAUTHORIZED") {
        await redisService.deleteSession(userId)
        await redisService.clearHistory(userId)
        // Return error message to LLM so it can communicate with user
        return {
          error: true,
          message:
            "Phiên đăng nhập đã hết hạn. Hãy thông báo cho người dùng rằng họ cần đăng nhập lại (chỉ cần nhắn tin bất kỳ).",
        }
      }

      // VALIDATION_ERROR or UNKNOWN: pass error context back to LLM
      return {
        error: true,
        message: `Hệ thống báo lỗi: ${result.error}. Hãy giải thích ngắn gọn và hỏi người dùng thông tin khác nếu cần.`,
      }
    }

    return result.data
  })

  // 4. Set up timeout with AbortController
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), env.AGENT_TIMEOUT_MS)

  try {
    const { text, messages: newMessages } = await generateAgentResponse({
      history: currentMessages,
      tools: aiTools,
      abortSignal: controller.signal,
    })

    // 5. Reply to user
    const replyText = text.trim() || "Tôi đã xử lý yêu cầu của bạn."
    await ctx.reply(replyText)

    // 6. Persist updated history (prepend user message to new messages)
    await redisService.appendHistory(userId, [userMessage, ...newMessages])
  } catch (err: unknown) {
    const isAborted =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("aborted"))

    if (isAborted) {
      await ctx.reply("⏱ Yêu cầu xử lý quá lâu. Vui lòng thử lại hoặc gửi yêu cầu ngắn hơn.")
    } else {
      console.error("[Handler] Unexpected agent error:", err)
      await ctx.reply("❌ Đã xảy ra lỗi không mong muốn. Xin thử lại.")
    }
  } finally {
    clearTimeout(timeoutHandle)
  }
}
