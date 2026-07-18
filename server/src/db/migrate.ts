import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { postgresConnectionOptions } from "./postgres-options.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

// Prefer DATABASE_MIGRATE_URL (Supabase direct/session) for DDL; fall back to DATABASE_URL
const migrateUrl = process.env.DATABASE_MIGRATE_URL || url;
if (/:6543\b/.test(migrateUrl) && /supabase/i.test(migrateUrl)) {
  console.warn(
    "[migrate] Using Supabase pooler :6543 — prefer DATABASE_MIGRATE_URL with the direct :5432 connection for migrations.",
  );
}

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

const client = postgres(migrateUrl, postgresConnectionOptions(migrateUrl, 1));
const db = drizzle(client);

await migrate(db, { migrationsFolder });
console.log("Migrations applied from", migrationsFolder);
await client.end();
