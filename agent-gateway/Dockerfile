# ============================================================
# Stage 1: Builder
# ============================================================
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

# ============================================================
# Stage 2: Runner
# ============================================================
FROM oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY package.json bun.lock* ./
RUN bun install --production

COPY --from=builder /app/dist ./dist

USER bun

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3002}/health || exit 1

EXPOSE 3002

CMD ["bun", "run", "dist/app.js"]
