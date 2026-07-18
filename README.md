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

## Deploy on Render

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → select the repo (`render.yaml`).
3. Blueprint creates **Postgres**, **Key Value (Redis)**, and the **wwp-api** Docker web service.
4. When prompted, set:
   - `APP_URL` — your frontend URL (e.g. `https://your-site.com`)
   - `CORS_ORIGINS` — comma-separated origins allowed to call the API
   - `RESEND_API_KEY` — from [resend.com](https://resend.com)
   - `EMAIL_FROM` — verified sender, e.g. `WeWannaParty <tickets@yourdomain.com>` (use `WeWannaParty <onboarding@resend.dev>` only for Resend test sends to your own account email)
   - Optional Paystack keys for live payments
5. After deploy, health check: `https://<your-api>.onrender.com/api/health`
6. Point the frontend `PUBLIC_API_URL` at that API URL.

The Docker entrypoint runs migrations + seed on boot. `API_PUBLIC_URL` defaults from Render’s `RENDER_EXTERNAL_URL`.

## Env

See [server/.env.example](server/.env.example). Required in production:

- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (long random)
- `CORS_ORIGINS`, `APP_URL` (`API_PUBLIC_URL` optional on Render)
- Optional: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- Optional: `RESEND_API_KEY`, `EMAIL_FROM` (ticket emails)
