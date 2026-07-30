FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json bun.lock ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile --production

COPY src ./src

EXPOSE 5000

CMD ["bun", "run", "src/index.ts"]
