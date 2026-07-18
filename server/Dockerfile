# syntax=docker/dockerfile:1

FROM oven/bun:1.2-alpine AS deps
WORKDIR /app/server
COPY server/package.json ./
RUN bun install --production

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY packages/shared ./packages/shared
COPY server/src ./server/src
COPY server/drizzle ./server/drizzle
COPY server/package.json server/tsconfig.json server/drizzle.config.ts server/docker-entrypoint.sh ./server/
COPY --from=deps /app/server/node_modules ./server/node_modules

RUN chmod +x /app/server/docker-entrypoint.sh \
  && addgroup -S wwp && adduser -S wwp -G wwp \
  && chown -R wwp:wwp /app

WORKDIR /app/server
USER wwp
EXPOSE 8787

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD bun -e "const r=await fetch('http://127.0.0.1:8787/api/health'); process.exit(r.ok?0:1)"

ENTRYPOINT ["/bin/sh", "/app/server/docker-entrypoint.sh"]
