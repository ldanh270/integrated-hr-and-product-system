# HRP Agent Gateway

Telegram AI Bot tích hợp HRP MCP Server. Đóng vai trò cầu nối giữa người dùng Telegram và hệ thống quản trị nhân sự nội bộ.

## Architecture

```
Telegram User
     │
     ▼
Telegraf Bot (agent-gateway)
     │
     ├── Rate Limit Middleware (Redis)
     ├── Auth Middleware → MCP login_start / login_status
     │
     ▼
Agent Handler
     ├── Load history (Redis)
     ├── generateText (Vercel AI SDK → 9Router)
     │       └── Tool calling loop (maxSteps=5)
     │              └── mcpService.callTool() ──► MCP Server (SSE)
     └── Save history (Redis)
```

## Auth Flow

1. User nhắn tin → check Redis session
2. Không có session → gọi `login_start` MCP tool → nhận `loginUrl`
3. Bot gửi `loginUrl` cho user
4. Background poll `login_status` mỗi 5s (max 5 phút)
5. Login thành công → lưu `sessionId` vào Redis (TTL 8h)
6. Từ đây mọi tool call tự động inject `sessionId`

## Setup

### 1. Copy env

```bash
cp .env.example .env
# Điền các giá trị: TELEGRAM_BOT_TOKEN, NINE_ROUTER_*, MCP_*, REDIS_URL
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Dev mode

```bash
# Chạy riêng
pnpm dev

# Hoặc từ root (cùng với MCP Server)
cd .. && nr dev:full
```

### 4. Docker (production)

```bash
# Từ root project
docker compose up -d redis mcp agent-gateway
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token từ BotFather | `123456:ABC...` |
| `NINE_ROUTER_BASE_URL` | 9Router / OpenRouter API endpoint | `https://openrouter.ai/api/v1` |
| `NINE_ROUTER_API_KEY` | API key | `sk-or-...` |
| `NINE_ROUTER_MODEL` | Model routing string | `openai/gpt-4o-mini` |
| `MCP_SSE_URL` | MCP Server SSE endpoint | `http://mcp:3001/mcp/sse` |
| `MCP_MESSAGE_URL` | MCP Server message endpoint | `http://mcp:3001/mcp/message` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `PORT` | Health check port | `3002` |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/logout` | Xóa session + lịch sử |
| `/clear` | Xóa lịch sử trò chuyện |
| `/help` | Hướng dẫn sử dụng |

## File Structure

```
src/
├── config/
│   └── env.ts                     # Typed env (Zod validation)
├── services/
│   ├── redis.service.ts           # Session, history, rate-limit
│   ├── mcp.service.ts             # MCP SSE client + tool injection
│   └── llm.service.ts             # Vercel AI SDK + 9Router
├── middlewares/
│   ├── auth.middleware.ts         # Browser login flow
│   └── rate-limit.middleware.ts  # 1 msg/s per user
├── bot/
│   ├── index.ts                   # Telegraf setup + commands
│   └── handler.ts                 # Agent loop
└── app.ts                         # Entry point
```
