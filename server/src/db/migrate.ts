import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

const useSsl =
  process.env.DATABASE_SSL === "true" ||
  Boolean(process.env.RENDER) ||
  /[?&]sslmode=require/i.test(url);
const client = postgres(url, {
  max: 1,
  ssl: useSsl && process.env.DATABASE_SSL !== "false" ? "require" : undefined,
});
const db = drizzle(client);

await migrate(db, { migrationsFolder });
console.log("Migrations applied from", migrationsFolder);
await client.end();
