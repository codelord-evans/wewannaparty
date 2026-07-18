#!/bin/sh
set -e
echo "Waiting for Postgres…"
until bun -e "const u=process.env.DATABASE_URL; const {default:p}=await import('postgres'); const s=p(u,{max:1}); await s\`select 1\`; await s.end();"; do
  sleep 1
done
echo "Running migrations…"
bun run src/db/migrate.ts
echo "Seeding…"
bun run src/db/seed.ts || true
echo "Starting API…"
exec bun run src/index.ts
