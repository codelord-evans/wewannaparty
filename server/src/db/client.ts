import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";
import type { Env } from "../config.ts";

function shouldUseSsl(databaseUrl: string) {
  if (process.env.DATABASE_SSL === "false" || process.env.DATABASE_SSL === "disable") {
    return false;
  }
  if (process.env.DATABASE_SSL === "true" || process.env.RENDER) return true;
  return /[?&]sslmode=require/i.test(databaseUrl);
}

export function createDb(env: Env) {
  const isProd = env.NODE_ENV === "production";
  const client = postgres(env.DATABASE_URL, {
    max: isProd ? 20 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Render sets RENDER=true and requires TLS; local Docker Postgres usually does not
    ssl: shouldUseSsl(env.DATABASE_URL) ? "require" : undefined,
    prepare: true,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

export type Db = ReturnType<typeof createDb>["db"];
