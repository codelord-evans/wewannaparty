import { createMiddleware } from "hono/factory";
import type { Env } from "../config.ts";
import type { RedisClient } from "../redis/client.ts";
import { rateLimit } from "../redis/client.ts";
import { verifyAccessToken, type AccessClaims } from "../lib/auth.ts";

export type AppVariables = {
  env: Env;
  user?: AccessClaims;
  requestId: string;
};

export function securityHeaders() {
  return createMiddleware(async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header("X-XSS-Protection", "0");
    if (c.get("env")?.NODE_ENV === "production") {
      c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
  });
}

export function requestId() {
  return createMiddleware(async (c, next) => {
    const id = c.req.header("x-request-id") ?? crypto.randomUUID();
    c.set("requestId", id);
    c.header("X-Request-Id", id);
    await next();
  });
}

export function redisRateLimit(redis: RedisClient, env: Env) {
  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const route = c.req.path.startsWith("/api/auth")
      ? "auth"
      : c.req.path.startsWith("/api/orders")
        ? "orders"
        : "api";
    const max = route === "auth" ? Math.min(20, env.RATE_LIMIT_MAX) : env.RATE_LIMIT_MAX;
    const result = await rateLimit(redis, `${route}:${ip}`, env.RATE_LIMIT_WINDOW_MS, max);
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetMs / 1000)));
    if (!result.allowed) {
      return c.json({ error: "Too many requests. Slow down." }, 429);
    }
    await next();
  });
}

export function optionalAuth(env: Env) {
  return createMiddleware(async (c, next) => {
    const header = c.req.header("authorization");
    if (header?.startsWith("Bearer ")) {
      try {
        c.set("user", await verifyAccessToken(env, header.slice(7)));
      } catch {
        // ignore invalid optional auth
      }
    }
    await next();
  });
}

export function requireAuth(env: Env) {
  return createMiddleware(async (c, next) => {
    const header = c.req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      c.set("user", await verifyAccessToken(env, header.slice(7)));
    } catch {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
    await next();
  });
}
