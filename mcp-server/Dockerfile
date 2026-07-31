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
ENV PORT=3001

COPY package.json bun.lock* ./
RUN bun install --production

COPY --from=builder /app/dist ./dist
# Auth page HTML is served statically at runtime
COPY --from=builder /app/src/auth ./dist/auth

USER bun

EXPOSE 3001

CMD ["bun", "run", "dist/server.js"]
