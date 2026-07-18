import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().min(1),
  /** Optional Supabase direct/session URI for migrations (port 5432) */
  DATABASE_MIGRATE_URL: z.string().optional().default(""),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:4321,http://127.0.0.1:4321"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  INVENTORY_HOLD_TTL_SEC: z.coerce.number().default(600),
  PAYSTACK_SECRET_KEY: z.string().optional().default(""),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default(""),
  APP_URL: z.string().default("http://localhost:4321"),
  API_PUBLIC_URL: z.string().default("http://localhost:8787"),
  /** Resend API key — leave empty to skip outbound email in local/dev */
  RESEND_API_KEY: z.string().optional().default(""),
  /** Verified sender, e.g. "WeWannaParty <tickets@yourdomain.com>" */
  EMAIL_FROM: z.string().default("WeWannaParty <onboarding@resend.dev>"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    ...process.env,
    // Render injects RENDER_EXTERNAL_URL (https://….onrender.com)
    API_PUBLIC_URL:
      process.env.API_PUBLIC_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      "http://localhost:8787",
  });
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid environment variables");
  }
  return parsed.data;
}
