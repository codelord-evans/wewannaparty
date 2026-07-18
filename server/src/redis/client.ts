import Redis from "ioredis";
import type { Env } from "../config.ts";

export function createRedis(env: Env) {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on("error", (err) => {
    console.error("[redis]", err.message);
  });

  return redis;
}

export type RedisClient = ReturnType<typeof createRedis>;

/** Atomic inventory hold: reserve qty if remaining capacity allows. */
const HOLD_LUA = `
local key = KEYS[1]
local qty = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local sold = tonumber(ARGV[3])
local holdTtl = tonumber(ARGV[4])
local holdId = ARGV[5]

local held = tonumber(redis.call('GET', key) or '0')
local remaining = capacity - sold - held
if remaining < qty then
  return {0, remaining}
end

redis.call('INCRBY', key, qty)
redis.call('EXPIRE', key, holdTtl)
redis.call('SET', 'hold:' .. holdId, cjson.encode({key=key, qty=qty}), 'EX', holdTtl)
return {1, remaining - qty}
`;

const RELEASE_LUA = `
local holdId = ARGV[1]
local raw = redis.call('GET', 'hold:' .. holdId)
if not raw then
  return 0
end
local data = cjson.decode(raw)
redis.call('DECRBY', data.key, data.qty)
local cur = tonumber(redis.call('GET', data.key) or '0')
if cur <= 0 then
  redis.call('DEL', data.key)
else
  -- keep TTL
end
redis.call('DEL', 'hold:' .. holdId)
return 1
`;

export async function reserveInventory(
  redis: RedisClient,
  ticketTypeId: number,
  qty: number,
  capacity: number,
  sold: number,
  holdTtlSec: number,
  holdId: string,
) {
  const key = `inv:held:${ticketTypeId}`;
  const result = (await redis.eval(
    HOLD_LUA,
    1,
    key,
    qty,
    capacity,
    sold,
    holdTtlSec,
    holdId,
  )) as [number, number];
  return { ok: result[0] === 1, remaining: result[1] };
}

export async function releaseHold(redis: RedisClient, holdId: string) {
  return (await redis.eval(RELEASE_LUA, 0, holdId)) === 1;
}

export async function rateLimit(
  redis: RedisClient,
  key: string,
  windowMs: number,
  max: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const now = Date.now();
  const bucket = `rl:${key}:${Math.floor(now / windowMs)}`;
  const count = await redis.incr(bucket);
  if (count === 1) await redis.pexpire(bucket, windowMs);
  const ttl = await redis.pttl(bucket);
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetMs: ttl > 0 ? ttl : windowMs,
  };
}
