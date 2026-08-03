# ============================================================
# Backend — Bun + Express + Prisma (multi-stage)
# ============================================================
FROM oven/bun:1 AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json bun.lock* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Install all deps (including dev for prisma generate)
RUN bun install

# ---- Prisma generate (requires devDeps) ----
FROM deps AS builder
RUN bunx prisma generate

# ---- Production runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

# Copy prisma schema + config + generated client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY tsconfig.json ./tsconfig.json

# Copy source
COPY src ./src

EXPOSE 5000

# Run as non-root bun user
USER bun

CMD ["bun", "run", "src/index.ts"]
