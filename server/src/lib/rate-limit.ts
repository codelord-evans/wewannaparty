/** Simple in-process rate limiter (single Render instance is enough without Redis). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  windowMs: number,
  max: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucketKey = `${key}:${Math.floor(now / windowMs)}`;
  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(bucketKey, bucket);
  }
  bucket.count += 1;

  // Opportunistic cleanup of old buckets
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  return {
    allowed: bucket.count <= max,
    remaining: Math.max(0, max - bucket.count),
    resetMs: Math.max(0, bucket.resetAt - now),
  };
}
