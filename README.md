# WeWannaParty × WeAreAfro

Astro UI + production Bun/Hono API with **Postgres** (source of truth) and **Redis** (inventory holds, rate limits, cache), orchestrated by Docker.

> Redis alone is not enough for durable tickets/orders. We use **Postgres + Redis**: Postgres stores users/orders/tickets permanently; Redis absorbs traffic spikes with atomic inventory locks and rate limiting.

## Architecture

```
Astro (web) ──► Hono API (Bun, horizontally scalable)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   PostgreSQL 16            Redis 7
   (durable data)     (holds / RL / cache)
```

**Security:** Argon2id passwords, JWT (jose), Zod validation, Redis rate limits, security headers, Paystack webhook HMAC, idempotent orders, non-root containers.

**Scale:** Stateless API, Redis Lua inventory reservation (prevents oversell under load), connection pooling, Docker resource limits, health/readiness probes.

## Quick start (Docker)

```bash
cp server/.env.example .env
# edit JWT_SECRET (32+ chars) and passwords

docker compose up --build
```

- API: http://localhost:8787/api/health  
- Postgres: `localhost:5432`  
- Redis: `localhost:6379`

Seeded event: `GET /api/events/wer-afro`

## Local API (without Docker app process)

```bash
docker compose up -d postgres redis
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
| GET | `/api/health` | Postgres + Redis checks |
| GET | `/api/events/:slug` | Cached ~30s in Redis |
| POST | `/api/auth/register` · `/login` | Argon2id + JWT |
| POST | `/api/orders` | Idempotency-Key; Redis inventory hold |
| POST | `/api/orders/:id/confirm` | Finalize + issue QR tickets |
| GET | `/api/orders/:id?email=` | Buyer ticket bundle |
| GET | `/api/tickets/:code` | Public ticket lookup |
| POST | `/api/payments/paystack/initialize/:orderId` | Live Paystack |
| POST | `/api/payments/paystack/webhook` | Signed webhook |

Without `PAYSTACK_SECRET_KEY`, checkout uses local confirm (still issues real DB tickets). With Paystack keys, buyers pay then land on `/success` with on-screen + downloadable QR tickets.

When `RESEND_API_KEY` is set, confirming an order also emails the buyer a branded ticket (QR + codes + link back to `/success`). Emails are sent once per order (`orders.email_sent_at`).

## Deploy (Supabase Postgres + Render API/Redis)

Recommended cost-friendly setup:

| Piece | Where | Notes |
|-------|--------|--------|
| Postgres | [Supabase](https://supabase.com) free project | Durable orders/tickets |
| Redis | Render Key Value **or** [Upstash](https://upstash.com) free | Holds, rate limits, cache |
| API | Render Docker web service | `server/Dockerfile` |

### 1. Supabase

1. Create a project → **Project Settings → Database**.
2. Copy **Transaction** pooler URI (port **6543**) → use as `DATABASE_URL` on Render.
3. Copy **Session** / direct URI (port **5432**) → optional `DATABASE_MIGRATE_URL` (safer for migrations).
4. Password is the one you set when creating the project.

### 2. Redis

- **Render:** New → Key Value → copy connection string → `REDIS_URL`, **or**
- **Upstash:** create Redis → copy `rediss://…` URL → `REDIS_URL` (works the same).

### 3. Render web service

1. Push this repo to GitHub.
2. New → Web Service → Docker, Dockerfile `./server/Dockerfile`, root directory **empty**.
3. Set environment variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Supabase transaction pooler URI |
| `DATABASE_MIGRATE_URL` | Supabase session/direct URI (recommended) |
| `REDIS_URL` | Render Key Value or Upstash URL |
| `JWT_SECRET` | long random (32+ chars) |
| `NODE_ENV` | `production` |
| `APP_URL` | your frontend URL |
| `CORS_ORIGINS` | frontend origin(s), comma-separated |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional ticket email |
| Paystack keys | optional |

4. Health check path: `/api/health`
5. After deploy: `https://<your-api>.onrender.com/api/health`

Or use Blueprint (`render.yaml`) for API + Redis, then paste Supabase URLs when prompted.

The Docker entrypoint runs migrations + seed on boot. `API_PUBLIC_URL` defaults from Render’s `RENDER_EXTERNAL_URL`.

## Env

See [server/.env.example](server/.env.example). Required in production:

- `DATABASE_URL` (Supabase), `REDIS_URL`, `JWT_SECRET` (long random)
- `CORS_ORIGINS`, `APP_URL` (`API_PUBLIC_URL` optional on Render)
- Optional: `DATABASE_MIGRATE_URL`, Paystack keys, `RESEND_API_KEY`, `EMAIL_FROM`
