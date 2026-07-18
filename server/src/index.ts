import { loadEnv } from "./config.ts";
import { createDb } from "./db/client.ts";
import { createApp } from "./app.ts";

const env = loadEnv();
const { db, client } = createDb(env);
const app = createApp(env, db);

const shutdown = async () => {
  console.log("Shutting down…");
  await client.end({ timeout: 5 });
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`WeWannaParty API listening on :${env.PORT} (${env.NODE_ENV})`);

export default {
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 60,
};
