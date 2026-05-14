// Per-instance in-memory rate limiter. Works per serverless container.
// For global rate limiting across instances, use Vercel KV / Upstash Redis.
const store = new Map<string, { count: number; resetAt: number }>();

function makeWindowLimiter(windowMs: number, max: number) {
  return {
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count++;
      return true;
    },
  };
}

export const loginLimiter = makeWindowLimiter(15 * 60 * 1000, 10);
