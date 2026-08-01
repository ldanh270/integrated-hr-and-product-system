import { createOpenAI } from "@ai-sdk/openai"
import type { CoreMessage, CoreTool } from "ai"
import { streamText, tool } from "ai"
import { z } from "zod"

import { env } from "../config/env.js"
import type { McpToolDefinition } from "./mcp.service.js"

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Bạn là trợ lý nhân sự nội bộ HRP thông minh và chủ động.

Quy tắc BẮTBUỘC:
1. Khi người dùng yêu cầu nghiệp vụ (xin nghỉ phép, xem lịch, tra phiếu lương...): kiểm tra Tools và gọi tool phù hợp.
2. Nếu tool cần tham số mà người dùng chưa cung cấp: HỎI LẠI từng tham số một, không tự đặt giá trị.
3. TUYỆT ĐỐI không bịa thông tin (ngày, tên, mã nhân viên...).
4. Khi tool trả về lỗi: giải thích ngắn gọn, hỏi người dùng thông tin khác.
5. Trả lời NGẮN GỌN, súc tích bằng tiếng Việt.
6. KHÔNG bao giờ hỏi người dùng về sessionId — bạn tự quản lý nó.
7. Khi dùng tool "login_start" hoặc "login_status": đây là quá trình đăng nhập, hướng dẫn người dùng bước tiếp theo.

Phong cách: Thân thiện, chuyên nghiệp, như một nhân viên HR giỏi.`

// ---------------------------------------------------------------------------
// 9Router provider (OpenAI-compatible API)
// ---------------------------------------------------------------------------
const nineRouter = createOpenAI({
  name: "9router",
  baseURL: env.NINE_ROUTER_BASE_URL,
  apiKey: env.NINE_ROUTER_API_KEY,
})

// ---------------------------------------------------------------------------
// MCP Tool → AI SDK Tool converter
// ---------------------------------------------------------------------------

/**
 * Converts MCP tool definitions to Vercel AI SDK CoreTool format.
 * Dynamically builds Zod schemas from MCP input schemas.
 */
export function convertMcpToolsToAiSdk(
  mcpTools: McpToolDefinition[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Record<string, CoreTool> {
  const aiTools: Record<string, CoreTool> = {}

  for (const mcpTool of mcpTools) {
    // Build a dynamic Zod schema from MCP inputSchema.properties
    const properties = mcpTool.inputSchema.properties ?? {}
    const required = mcpTool.inputSchema.required ?? []

    const schemaShape: Record<string, z.ZodTypeAny> = {}

    for (const [key, propDef] of Object.entries(properties)) {
      // Skip sessionId — the gateway injects it automatically
      if (key === "sessionId") continue

      const prop = propDef as Record<string, unknown>
      const description = (prop.description as string | undefined) ?? key

      let zodType: z.ZodTypeAny

      switch (prop.type) {
        case "number":
        case "integer":
          zodType = z.number().describe(description)
          break
        case "boolean":
          zodType = z.boolean().describe(description)
          break
        case "array":
          zodType = z.array(z.unknown()).describe(description)
          break
        default:
          zodType = z.string().describe(description)
      }

      // Make optional if not in required list
      schemaShape[key] = required.includes(key) ? zodType : zodType.optional()
    }

    aiTools[mcpTool.name] = tool({
      description: mcpTool.description ?? mcpTool.name,
      parameters: z.object(schemaShape),
      execute: async (args) => {
        return onToolCall(mcpTool.name, args as Record<string, unknown>)
      },
    })
  }

  return aiTools
}

// ---------------------------------------------------------------------------
// Generate Agent Response
// ---------------------------------------------------------------------------
export interface GenerateOptions {
  history: CoreMessage[]
  tools: Record<string, CoreTool>
  abortSignal?: AbortSignal
}

export interface GenerateResult {
  text: string
  messages: CoreMessage[]
}

/**
 * Run the AI agent loop with tool calling support.
 * Uses maxSteps to allow multi-turn tool use (LLM → tool → LLM → tool → ...).
 */
export async function generateAgentResponse(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { history, tools, abortSignal } = options

  // The local OpenAI-compatible proxy always responds using SSE, including
  // tool-call responses. `streamText` uses the provider's streaming parser;
  // `generateText` expects a JSON body and fails on `data: ...` chunks.
  const result = streamText({
    model: nineRouter(env.NINE_ROUTER_MODEL),
    system: SYSTEM_PROMPT,
    messages: history,
    tools,
    maxSteps: 5,
    // Only spread abortSignal if defined — required by exactOptionalPropertyTypes
    ...(abortSignal !== undefined && { abortSignal }),
  })

  // AI SDK v4: result.response.messages contains all messages from the run
  // (tool calls, tool results, and assistant turns)
  // `streamText` is lazy. Consume the stream so tool calls and follow-up
  // generations complete before reading its aggregate result promises.
  await result.consumeStream()

  const [text, response] = await Promise.all([result.text, result.response])
  const responseMessages = response.messages as CoreMessage[]

  return {
    text,
    messages: responseMessages,
  }
}
