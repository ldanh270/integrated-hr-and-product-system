# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests and install deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ============================================================
# Stage 2: Runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm for production install
RUN npm install -g pnpm

# Copy package manifests and install production deps only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3002}/health || exit 1

# Run as non-root node user
USER node

EXPOSE 3002

CMD ["node", "dist/app.js"]
