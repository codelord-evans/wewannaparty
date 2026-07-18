import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";
import type { Env } from "../config.ts";
import { postgresConnectionOptions } from "./postgres-options.ts";

export function createDb(env: Env) {
  const isProd = env.NODE_ENV === "production";
  const client = postgres(env.DATABASE_URL, postgresConnectionOptions(env.DATABASE_URL, isProd ? 10 : 5));
  const db = drizzle(client, { schema });
  return { db, client };
}

export type Db = ReturnType<typeof createDb>["db"];
