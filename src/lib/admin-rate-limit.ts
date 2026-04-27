const WINDOW_MS = 1000 * 60 * 10;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 1000 * 60 * 15;

type AttemptState = {
  count: number;
  windowStart: number;
  blockedUntil: number;
};

const attempts = new Map<string, AttemptState>();

// Production admin login rate limiting should be enforced at the edge by Cloudflare.
// This in-memory limiter is a best-effort fallback for local development and any
// request that reaches the app after Cloudflare/Vercel. It is not a durable
// security boundary in serverless or multi-instance production deployments.

function getFreshState(now: number): AttemptState {
  return {
    count: 0,
    windowStart: now,
    blockedUntil: 0,
  };
}

function normalizeIp(value?: string | null) {
  const candidate = value?.split(",")[0]?.trim();
  if (!candidate) return "";

  return candidate
    .replace(/^\[|\]$/g, "")
    .replace(/^::ffff:/i, "")
    .slice(0, 128);
}

export function getClientRateLimitKey(headers: Headers) {
  return normalizeIp(headers.get("cf-connecting-ip"))
    || normalizeIp(headers.get("x-real-ip"))
    || normalizeIp(headers.get("x-forwarded-for"))
    || "unknown";
}

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current) {
    attempts.set(key, getFreshState(now));
    return { allowed: true, retryAfterMs: 0 };
  }

  if (current.blockedUntil > now) {
    return { allowed: false, retryAfterMs: current.blockedUntil - now };
  }

  if (now - current.windowStart > WINDOW_MS) {
    attempts.set(key, getFreshState(now));
    return { allowed: true, retryAfterMs: 0 };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  const state =
    !current || now - current.windowStart > WINDOW_MS
      ? getFreshState(now)
      : current;

  state.count += 1;

  if (state.count >= MAX_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_MS;
  }

  attempts.set(key, state);

  return {
    blocked: state.blockedUntil > now,
    retryAfterMs: state.blockedUntil > now ? state.blockedUntil - now : 0,
  };
}

export function clearFailedLogins(key: string) {
  attempts.delete(key);
}
