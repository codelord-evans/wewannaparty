# WeWannaParty × WeAreAfro (Astro + Bun clone)

Pixel-faithful public ticketing experience for **We\*R Afro**, built with **Astro** (SEO-first UI) and **Bun** (API / business logic).

## Stack

| Layer | Tech |
|-------|------|
| UI | Astro 7 + React islands + Tailwind CSS 4 |
| API | Bun + Hono |
| Data | Seeded We\*R Afro event, tickets, artists, gallery |

## Quick start

```bash
# install
bun install
cd server && bun install && cd ..

# terminal 1 — API (port 8787)
bun run dev:api

# terminal 2 — Astro (port 4321)
bun run dev:web
```

Open [http://localhost:4321/event/wer-afro](http://localhost:4321/event/wer-afro).

## Pages

- `/` — Home / featured events
- `/events` — Event listing
- `/event/wer-afro` — Event detail (hero, about, artists, venue, ticket sidebar)
- `/event/wer-afro/spots` — Seat / spot picker
- `/checkout/wer-afro` — Checkout (mock M-Pesa / card)
- `/success/wer-afro` — Payment success
- `/auth` — Create account / login
- `/gallery`, `/about`, `/create-event`, `/support`, `/wiki`
- `/partner`, `/agent`, `/terms`, `/privacy`

## API

Base: `http://localhost:8787`

- `GET /api/events/:slug`
- `GET /api/events`
- `GET /api/gallery`
- `POST /api/orders` → `POST /api/orders/:id/confirm`
- `POST /api/auth/register` · `POST /api/auth/login`
- `POST /api/create-event` · `POST /api/contact`

Payments are **mocked** (no live M-Pesa/Paystack).
