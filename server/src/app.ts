import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, sql } from "drizzle-orm";
import type { Env } from "./config.ts";
import type { Db } from "./db/client.ts";
import type { RedisClient } from "./redis/client.ts";
import { contactMessages, issuedTickets, orders, users } from "./db/schema.ts";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from "./lib/auth.ts";
import {
  contactSchema,
  createEventSchema,
  createOrderSchema,
  loginSchema,
  registerSchema,
} from "./lib/validation.ts";
import {
  optionalAuth,
  redisRateLimit,
  requestId,
  securityHeaders,
  type AppVariables,
} from "./middleware/security.ts";
import {
  createOrder,
  formatKes,
  getEventBySlug,
  getOrderBundle,
  listFeaturedEvents,
  listGallery,
  markOrderPaid,
  orderDisplayRef,
} from "./services/catalog.ts";
import { sendOrderTicketsEmail } from "./services/email.ts";

export function createApp(env: Env, db: Db, redis: RedisClient) {
  const app = new Hono<{ Variables: AppVariables & { env: Env } }>();

  app.use("*", async (c, next) => {
    c.set("env", env);
    await next();
  });
  app.use("*", requestId());
  app.use("*", securityHeaders());
  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Request-Id", "Idempotency-Key"],
      exposeHeaders: ["X-Request-Id", "X-RateLimit-Remaining"],
      maxAge: 600,
      credentials: true,
    }),
  );
  app.use("/api/*", redisRateLimit(redis, env));
  app.use("/api/*", optionalAuth(env));

  app.get("/api/health", async (c) => {
    let postgresOk = false;
    let redisOk = false;
    try {
      await db.execute(sql`select 1`);
      postgresOk = true;
    } catch {
      postgresOk = false;
    }
    try {
      redisOk = (await redis.ping()) === "PONG";
    } catch {
      redisOk = false;
    }
    const ok = postgresOk && redisOk;
    return c.json(
      {
        ok,
        runtime: "bun",
        checks: { postgres: postgresOk, redis: redisOk },
      },
      ok ? 200 : 503,
    );
  });

  app.get("/api/ready", (c) => c.redirect("/api/health"));

  app.get("/api/events", async (c) => {
    const results = await listFeaturedEvents(db);
    return c.json({ count: results.length, results });
  });

  app.get("/api/events/featured", async (c) => {
    const results = await listFeaturedEvents(db);
    return c.json({ count: results.length, results });
  });

  app.get("/api/events/:slug", async (c) => {
    const cacheKey = `cache:event:${c.req.param("slug")}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      c.header("X-Cache", "HIT");
      return c.json(JSON.parse(cached));
    }
    const event = await getEventBySlug(db, c.req.param("slug"));
    if (!event) return c.json({ error: "Event not found" }, 404);
    await redis.set(cacheKey, JSON.stringify(event), "EX", 30);
    c.header("X-Cache", "MISS");
    return c.json(event);
  });

  app.get("/api/gallery", async (c) => c.json(await listGallery(db)));

  app.post("/api/auth/register", async (c) => {
    const body = registerSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid input", details: body.error.flatten() }, 400);

    const email = body.data.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return c.json({ error: "Account already exists" }, 409);

    const passwordHash = await hashPassword(body.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        fullName: body.data.fullName,
        phone: body.data.phone,
        passwordHash,
      })
      .returning();

    const accessToken = await signAccessToken(env, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(env, user.id);

    return c.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
      accessToken,
      refreshToken,
    });
  });

  app.post("/api/auth/login", async (c) => {
    const body = loginSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid input" }, 400);

    const email = body.data.email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(user.passwordHash, body.data.password))) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const accessToken = await signAccessToken(env, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(env, user.id);

    return c.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
      accessToken,
      refreshToken,
    });
  });

  app.post("/api/orders", async (c) => {
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
    }

    const idempotencyKey =
      parsed.data.idempotencyKey ?? c.req.header("idempotency-key") ?? undefined;

    try {
      const result = await createOrder(db, redis, env, {
        ...parsed.data,
        idempotencyKey,
        userId: c.get("user")?.sub,
      });

      const order = result.order;
      const authorizationUrl =
        env.PAYSTACK_SECRET_KEY
          ? `${env.API_PUBLIC_URL}/api/payments/paystack/initialize/${order.id}`
          : `${env.APP_URL}/success/${order.eventSlug}?order=${order.id}&email=${encodeURIComponent(order.email)}`;

      return c.json({
        order: {
          id: order.id,
          eventSlug: order.eventSlug,
          email: order.email,
          phone: order.phone,
          fullName: order.fullName,
          paymentMethod: order.paymentMethod,
          subtotal: order.subtotalKes,
          serviceFee: order.serviceFeeKes,
          total: order.totalKes,
          status: order.status,
          createdAt: order.createdAt,
          paystackReference: order.paystackReference,
        },
        payment: {
          provider: env.PAYSTACK_SECRET_KEY ? "paystack" : "dev-confirm",
          message: env.PAYSTACK_SECRET_KEY
            ? "Complete payment via Paystack to receive your tickets."
            : "Dev mode: call POST /api/orders/:id/confirm to finalize (set PAYSTACK_SECRET_KEY for live payments).",
          checkoutUrl: authorizationUrl,
          reference: order.paystackReference,
        },
        totals: {
          subtotalLabel: formatKes(order.subtotalKes),
          serviceFeeLabel: formatKes(order.serviceFeeKes),
          totalLabel: formatKes(order.totalKes),
        },
        replayed: result.replayed,
      });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      return c.json({ error: err instanceof Error ? err.message : "Order failed" }, status as 400);
    }
  });

  /**
   * Finalize payment (Paystack webhook / verify; also local/dev).
   * Idempotent: re-confirming a paid order returns alreadyPaid + email status without re-issuing tickets.
   */
  app.post("/api/orders/:id/confirm", async (c) => {
    try {
      const orderId = c.req.param("id");
      const result = await markOrderPaid(db, redis, orderId);
      await redis.del(`cache:event:${result.order.eventSlug}`);

      // Always return explicit email outcome (sent | already_sent | not_configured | …)
      const email =
        result.alreadyPaid && result.order.emailSentAt
          ? ({ sent: false, reason: "already_sent" } as const)
          : await sendOrderTicketsEmail(env, db, orderId);

      return c.json({
        order: result.order,
        tickets: result.tickets.map((t) => ({
          id: t.id,
          code: t.ticketCode,
          qrPayload: t.qrPayload,
          seatLabel: t.seatLabel,
          status: t.status,
        })),
        alreadyPaid: result.alreadyPaid,
        email,
      });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      return c.json({ error: err instanceof Error ? err.message : "Confirm failed" }, status as 400);
    }
  });

  app.get("/api/orders/:id", async (c) => {
    const bundle = await getOrderBundle(db, c.req.param("id"));
    if (!bundle) return c.json({ error: "Order not found" }, 404);

    const user = c.get("user");
    const emailQ = c.req.query("email")?.toLowerCase();
    const allowed =
      (user && (user.sub === bundle.order.userId || user.role === "admin")) ||
      (emailQ && emailQ === bundle.order.email);
    if (!allowed) {
      return c.json({ error: "Forbidden — provide ?email= matching the order or an auth token" }, 403);
    }

    return c.json({
      order: {
        id: bundle.order.id,
        displayRef: orderDisplayRef(bundle.order.id),
        eventSlug: bundle.order.eventSlug,
        email: bundle.order.email,
        fullName: bundle.order.fullName,
        phone: bundle.order.phone,
        status: bundle.order.status,
        totalKes: bundle.order.totalKes,
        paidAt: bundle.order.paidAt,
      },
      event: bundle.event
        ? {
            name: bundle.event.name,
            date: bundle.event.date,
            startTime: bundle.event.startTime,
            doorsOpen: bundle.event.doorsOpen,
            venueName: bundle.event.venueName,
            location: bundle.event.location,
          }
        : null,
      items: bundle.items,
      tickets: bundle.tickets.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        qrPayload: t.qrPayload,
        seatLabel: t.seatLabel,
        status: t.status,
        ticketName: t.ticketName,
        index: t.index,
        total: t.total,
      })),
    });
  });

  app.get("/api/tickets/:code", async (c) => {
    const [ticket] = await db
      .select()
      .from(issuedTickets)
      .where(eq(issuedTickets.ticketCode, c.req.param("code")))
      .limit(1);
    if (!ticket) return c.json({ error: "Ticket not found" }, 404);
    const orderBundle = await getOrderBundle(db, ticket.orderId);
    return c.json({
      ticket: {
        code: ticket.ticketCode,
        qrPayload: ticket.qrPayload,
        seatLabel: ticket.seatLabel,
        status: ticket.status,
      },
      order: orderBundle
        ? {
            id: orderBundle.order.id,
            eventSlug: orderBundle.order.eventSlug,
            fullName: orderBundle.order.fullName,
            status: orderBundle.order.status,
          }
        : null,
    });
  });

  app.post("/api/payments/paystack/initialize/:orderId", async (c) => {
    if (!env.PAYSTACK_SECRET_KEY) {
      return c.json({ error: "Paystack is not configured" }, 503);
    }
    const bundle = await getOrderBundle(db, c.req.param("orderId"));
    if (!bundle) return c.json({ error: "Order not found" }, 404);
    if (bundle.order.status === "paid") {
      return c.json({
        message: "Already paid",
        checkoutUrl: `${env.APP_URL}/success/${bundle.order.eventSlug}?order=${bundle.order.id}&email=${encodeURIComponent(bundle.order.email)}`,
      });
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: bundle.order.email,
        amount: bundle.order.totalKes * 100,
        currency: "KES",
        reference: bundle.order.paystackReference,
        callback_url: `${env.APP_URL}/success/${bundle.order.eventSlug}?order=${bundle.order.id}&email=${encodeURIComponent(bundle.order.email)}`,
        metadata: { orderId: bundle.order.id, eventSlug: bundle.order.eventSlug },
        channels: bundle.order.paymentMethod === "mpesa" ? ["mobile_money"] : ["card", "mobile_money"],
      }),
    });
    const data = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };
    if (!data.status || !data.data) {
      return c.json({ error: data.message || "Paystack init failed" }, 502);
    }
    return c.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  });

  app.post("/api/payments/paystack/webhook", async (c) => {
    if (!env.PAYSTACK_SECRET_KEY) return c.json({ error: "Not configured" }, 503);
    const raw = await c.req.text();
    const signature = c.req.header("x-paystack-signature");
    const crypto = await import("node:crypto");
    const hash = crypto.createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
    if (!signature || signature !== hash) {
      return c.json({ error: "Invalid signature" }, 401);
    }
    const event = JSON.parse(raw) as {
      event: string;
      data: { reference: string; status: string };
    };
    if (event.event === "charge.success" && event.data.status === "success") {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.paystackReference, event.data.reference))
        .limit(1);
      if (order) {
        await markOrderPaid(db, redis, order.id);
        await redis.del(`cache:event:${order.eventSlug}`);
        await sendOrderTicketsEmail(env, db, order.id);
      }
    }
    return c.json({ received: true });
  });

  app.post("/api/create-event", async (c) => {
    const body = createEventSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid input" }, 400);
    return c.json({
      ok: true,
      message: "Event submission received. Our team will review it shortly.",
      submissionId: crypto.randomUUID(),
    });
  });

  app.post("/api/contact", async (c) => {
    const body = contactSchema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid input" }, 400);
    const ticketId = `SUP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    await db.insert(contactMessages).values({
      name: body.data.name,
      email: body.data.email,
      orderId: body.data.orderId,
      message: body.data.message,
      ticketId,
    });
    return c.json({
      ok: true,
      message: "Thanks — support will get back to you within 24 hours.",
      ticketId,
    });
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((err, c) => {
    console.error(`[${c.get("requestId")}]`, err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
