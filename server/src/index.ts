import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  events,
  featuredEvents,
  galleryItems,
  type Order,
  type OrderRequest,
  type User,
} from "../../packages/shared/src/index.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:4321", "http://127.0.0.1:4321"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

const orders = new Map<string, Order>();
const users = new Map<string, User & { password: string }>();

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

app.get("/api/health", (c) => c.json({ ok: true, runtime: "bun" }));

app.get("/api/events", (c) => c.json({ count: featuredEvents.length, results: featuredEvents }));

app.get("/api/events/featured", (c) =>
  c.json({ count: featuredEvents.length, results: featuredEvents }),
);

app.get("/api/events/:slug", (c) => {
  const slug = c.req.param("slug");
  const event = events.find((e) => e.slug === slug);
  if (!event) return c.json({ error: "Event not found" }, 404);
  return c.json(event);
});

app.get("/api/gallery", (c) => c.json(galleryItems));

app.post("/api/auth/register", async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }>();

  if (!body.email || !body.password || !body.fullName) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (users.has(body.email.toLowerCase())) {
    return c.json({ error: "Account already exists" }, 409);
  }

  const user: User & { password: string } = {
    id: crypto.randomUUID(),
    email: body.email.toLowerCase(),
    fullName: body.fullName,
    phone: body.phone,
    password: body.password,
  };
  users.set(user.email, user);

  return c.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
    token: `wwp_${user.id}`,
  });
});

app.post("/api/auth/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const user = users.get(body.email?.toLowerCase() ?? "");
  if (!user || user.password !== body.password) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  return c.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
    token: `wwp_${user.id}`,
  });
});

app.post("/api/orders", async (c) => {
  const body = await c.req.json<OrderRequest>();
  const event = events.find((e) => e.slug === body.eventSlug);
  if (!event) return c.json({ error: "Event not found" }, 404);
  if (!body.items?.length) return c.json({ error: "No tickets selected" }, 400);
  if (!body.email || !body.fullName || !body.phone) {
    return c.json({ error: "Missing buyer details" }, 400);
  }

  let subtotal = 0;
  for (const item of body.items) {
    const ticket = event.tickets.find((t) => t.id === item.ticketId);
    if (!ticket || !ticket.available) {
      return c.json({ error: `Ticket ${item.ticketId} unavailable` }, 400);
    }
    if (item.quantity < 1) return c.json({ error: "Invalid quantity" }, 400);
    subtotal += ticket.price_kes * item.quantity;
  }

  const serviceFee = event.service_fee_kes * body.items.reduce((n, i) => n + i.quantity, 0);
  const order: Order = {
    id: `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    eventSlug: body.eventSlug,
    items: body.items,
    email: body.email,
    phone: body.phone,
    fullName: body.fullName,
    paymentMethod: body.paymentMethod,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);

  return c.json({
    order,
    payment: {
      provider: body.paymentMethod === "mpesa" ? "M-Pesa STK (mock)" : "Card (mock)",
      message:
        body.paymentMethod === "mpesa"
          ? `STK push sent to ${body.phone}. Enter PIN to complete.`
          : "Redirecting to secure card payment…",
      checkoutUrl: `/success/${event.slug}?order=${order.id}`,
    },
    totals: {
      subtotalLabel: formatKes(subtotal),
      serviceFeeLabel: formatKes(serviceFee),
      totalLabel: formatKes(order.total),
    },
  });
});

app.post("/api/orders/:id/confirm", async (c) => {
  const order = orders.get(c.req.param("id"));
  if (!order) return c.json({ error: "Order not found" }, 404);
  order.status = "paid";
  orders.set(order.id, order);
  return c.json({ order });
});

app.get("/api/orders/:id", (c) => {
  const order = orders.get(c.req.param("id"));
  if (!order) return c.json({ error: "Order not found" }, 404);
  return c.json({ order });
});

app.post("/api/create-event", async (c) => {
  const body = await c.req.json();
  return c.json({
    ok: true,
    message: "Event submission received. Our team will review it shortly.",
    submissionId: crypto.randomUUID(),
    payload: body,
  });
});

app.post("/api/contact", async (c) => {
  const body = await c.req.json();
  return c.json({
    ok: true,
    message: "Thanks — support will get back to you within 24 hours.",
    ticketId: `SUP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    payload: body,
  });
});

const port = Number(process.env.PORT ?? 8787);
console.log(`WeWannaParty API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
