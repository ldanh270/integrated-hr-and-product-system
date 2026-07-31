# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:24-alpine AS builder

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm@11.8.0

# Copy package manifests and install deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY agent-gateway/package.json ./agent-gateway/package.json
RUN pnpm install --frozen-lockfile --filter @ldanh270/hrp-agent-gateway...

# Copy source and compile TypeScript
COPY agent-gateway/tsconfig.json ./agent-gateway/tsconfig.json
COPY agent-gateway/src ./agent-gateway/src
RUN pnpm --filter @ldanh270/hrp-agent-gateway build

# ============================================================
# Stage 2: Runner
# ============================================================
FROM node:24-alpine AS runner

WORKDIR /workspace

# Install pnpm for production install
RUN npm install -g pnpm@11.8.0

# Copy package manifests and install production deps only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY agent-gateway/package.json ./agent-gateway/package.json
RUN pnpm install --frozen-lockfile --prod --filter @ldanh270/hrp-agent-gateway...

# Copy compiled output from builder
COPY --from=builder /workspace/agent-gateway/dist ./agent-gateway/dist

WORKDIR /workspace/agent-gateway

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3002}/health || exit 1

# Run as non-root node user
USER node

EXPOSE 3002

CMD ["node", "dist/app.js"]
