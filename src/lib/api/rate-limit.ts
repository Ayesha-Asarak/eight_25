/**
 * In-memory sliding-window rate limiter for the /api/audit route.
 *
 * Trade-offs (documented in README and ARCHITECTURE):
 * - In-memory: resets on every cold start / serverless instance restart
 * - Per-IP: uses X-Forwarded-For (Vercel) or socket address (local)
 * - No Redis required — appropriate for assignment / low-traffic use case
 * - Not shared across multiple Vercel instances; each instance tracks independently
 *
 * Configurable limits:
 *   MAX_REQUESTS — requests allowed per IP per window
 *   WINDOW_MS    — rolling window duration in milliseconds
 */

const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateEntry {
  /** Timestamps of recent requests (kept within the window) */
  timestamps: number[];
}

const store = new Map<string, RateEntry>();

/** Extracts the best-effort client IP from a Next.js Route Handler Request. */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; first entry is the client
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  // Fallback for local dev (no proxy)
  return 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Seconds until the oldest request leaves the window */
  retryAfterSeconds: number;
}

/**
 * Checks whether the requesting IP has exceeded the rate limit.
 * Mutates the in-memory store on every allowed request.
 */
export function checkRateLimit(request: Request): RateLimitResult {
  const ip = getClientIp(request);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const entry = store.get(ip) ?? { timestamps: [] };

  // Evict timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);

    store.set(ip, entry);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this request
  entry.timestamps.push(now);
  store.set(ip, entry);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}
