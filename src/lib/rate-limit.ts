// App-level rate limiter — in-memory, no Redis dependency.
// Tracks magic link requests per email: max 5 per hour.

const requests = new Map<string, number[]>();

const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkMagicLinkRateLimit(email: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
} {
  const now = Date.now();
  const key = email.trim().toLowerCase();

  const timestamps = (requests.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: WINDOW_MS - (now - oldestInWindow),
    };
  }

  timestamps.push(now);
  requests.set(key, timestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - timestamps.length,
    retryAfterMs: null,
  };
}
