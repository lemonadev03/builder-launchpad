// App-level rate limiter — in-memory, no Redis dependency.

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
};

function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const normalizedKey = key.trim().toLowerCase();

    const timestamps = (requests.get(normalizedKey) ?? []).filter(
      (t) => now - t < windowMs,
    );

    if (timestamps.length >= maxRequests) {
      const oldestInWindow = timestamps[0];
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: windowMs - (now - oldestInWindow),
      };
    }

    timestamps.push(now);
    requests.set(normalizedKey, timestamps);

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      retryAfterMs: null,
    };
  };
}

// 5 magic link requests per email per hour
export const checkMagicLinkRateLimit = createRateLimiter(5, 60 * 60 * 1000);

// 20 profile updates per user per hour
export const checkProfileUpdateRateLimit = createRateLimiter(
  20,
  60 * 60 * 1000,
);

// 10 file uploads per user per hour
export const checkUploadRateLimit = createRateLimiter(10, 60 * 60 * 1000);

// 5 community creations per user per hour
export const checkCommunityCreateRateLimit = createRateLimiter(
  5,
  60 * 60 * 1000,
);

// 20 community updates per user per hour
export const checkCommunityUpdateRateLimit = createRateLimiter(
  20,
  60 * 60 * 1000,
);

// 10 community uploads per user per hour
export const checkCommunityUploadRateLimit = createRateLimiter(
  10,
  60 * 60 * 1000,
);

// 5 email invite batches per community per hour
export const checkEmailInviteRateLimit = createRateLimiter(
  5,
  60 * 60 * 1000,
);

// 30 invite info lookups per IP per minute (anti-enumeration)
export const checkInviteInfoRateLimit = createRateLimiter(30, 60 * 1000);
