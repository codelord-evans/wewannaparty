/** Shared postgres.js options for local Docker, Render, and Supabase. */

export function postgresConnectionOptions(databaseUrl: string, max: number) {
  const isSupabase = /supabase\.(co|com)/i.test(databaseUrl);
  // Supabase transaction pooler (port 6543) does not support prepared statements
  const isPooler = isSupabase && /:6543\b/.test(databaseUrl);
  const useSsl =
    process.env.DATABASE_SSL !== "false" &&
    process.env.DATABASE_SSL !== "disable" &&
    (process.env.DATABASE_SSL === "true" ||
      Boolean(process.env.RENDER) ||
      isSupabase ||
      /[?&]sslmode=require/i.test(databaseUrl));

  return {
    max,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: useSsl ? ("require" as const) : undefined,
    prepare: !isPooler,
  };
}
