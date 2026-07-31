# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:24-alpine AS builder

WORKDIR /workspace

RUN npm install -g pnpm@11.8.0

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY mcp-server/package.json ./mcp-server/package.json
RUN pnpm install --frozen-lockfile --filter @ldanh270/hrp-mcp-server...

COPY mcp-server/tsconfig.json ./mcp-server/tsconfig.json
COPY mcp-server/src ./mcp-server/src
RUN pnpm --filter @ldanh270/hrp-mcp-server build

# ============================================================
# Stage 2: Runner
# ============================================================
FROM node:24-alpine AS runner

WORKDIR /workspace

RUN npm install -g pnpm@11.8.0

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY mcp-server/package.json ./mcp-server/package.json
RUN pnpm install --frozen-lockfile --prod --filter @ldanh270/hrp-mcp-server...

COPY --from=builder /workspace/mcp-server/dist ./mcp-server/dist
# Auth page HTML is served statically at runtime
COPY --from=builder /workspace/mcp-server/src/auth ./mcp-server/dist/auth

WORKDIR /workspace/mcp-server

# Run as non-root node user
USER node

EXPOSE 3001

CMD ["node", "dist/server.js"]
