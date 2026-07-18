# WeWannaParty × WeAreAfro

Astro UI + Bun/Hono API backed by **Postgres only** (Supabase in production). Inventory holds and rate limits run in Postgres / process memory — no Redis required.

## Architecture

```
Astro (web) ──► Hono API (Bun)
                    │
                    ▼
              PostgreSQL (Supabase)
         orders · tickets · inventory holds
```

**Security:** Argon2id passwords, JWT (jose), Zod validation, in-process rate limits, security headers, Paystack webhook HMAC, idempotent orders.

## Quick start (Docker)

```bash
cp server/.env.example .env
# edit JWT_SECRET (32+ chars)

docker compose up --build
```

- API: http://localhost:8787/api/health  
- Postgres: `localhost:5432`

Seeded event: `GET /api/events/wer-afro`

## Local API (without Docker app process)

```bash
docker compose up -d postgres
cp server/.env.example server/.env
cd server && bun install
bun run db:migrate && bun run db:seed
bun run dev
```

## Frontend

```bash
cd web && bun install && bun run dev
# PUBLIC_API_URL=http://localhost:8787
```

## Key API routes

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Postgres check |
| GET | `/api/events/:slug` | Event detail |
| POST | `/api/auth/register` · `/login` | Argon2id + JWT |
| POST | `/api/orders` | Idempotency-Key; Postgres inventory hold |
| POST | `/api/orders/:id/confirm` | Finalize + issue QR tickets |
| GET | `/api/orders/:id?email=` | Buyer ticket bundle |
| GET | `/api/tickets/:code` | Public ticket lookup |
| POST | `/api/payments/paystack/initialize/:orderId` | Live Paystack |
| POST | `/api/payments/paystack/webhook` | Signed webhook |

Without `PAYSTACK_SECRET_KEY`, checkout uses local confirm (still issues real DB tickets).

When `RESEND_API_KEY` is set, confirming an order emails the buyer a branded ticket once per order.

## Deploy (Supabase + Render)

| Piece | Where |
|-------|--------|
| Postgres | [Supabase](https://supabase.com) free project |
| API | Render Docker web service (`server/Dockerfile`) |

### Find the Postgres URI in Supabase

1. Open your project → click the **gear** (Project Settings).
2. Left sidebar → **Database**.
3. Scroll to **Connection string**.
4. Choose **URI** (not “App framework” / not the REST URL).
5. Toggle **Method**:
   - **Session** (port `5432`) → use for `DATABASE_URL` and `DATABASE_MIGRATE_URL` (simplest), **or**
   - **Transaction** (port `6543`) → `DATABASE_URL` only, keep Session for `DATABASE_MIGRATE_URL`.
6. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project.

It must look like `postgresql://postgres:...@...supabase.co:5432/postgres` — **not** `https://….supabase.co/rest/v1/`.

### Render env vars

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Supabase Postgres URI |
| `DATABASE_MIGRATE_URL` | Same Session URI (recommended) |
| `JWT_SECRET` | long random (32+ chars) |
| `NODE_ENV` | `production` |
| `APP_URL` | frontend URL |
| `CORS_ORIGINS` | frontend origin(s) |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional |
| Paystack keys | optional |

**Do not set `REDIS_URL`** — it is no longer used. Remove it from Render if present.

Dockerfile path: `./server/Dockerfile`, root directory empty. Health check: `/api/health`.

## Env

See [server/.env.example](server/.env.example).
