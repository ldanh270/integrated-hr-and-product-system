# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ============================================================
# Stage 2: Runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
# Auth page HTML is served statically at runtime
COPY --from=builder /app/src/auth ./dist/auth

# Run as non-root node user
USER node

EXPOSE 3001

CMD ["node", "dist/server.js"]
