import { NextResponse } from "next/server";

interface RateLimitEntry {
  timestamps: number[];
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastPruneAt = 0;

function pruneExpiredEntries(now: number): void {
  if (now - lastPruneAt < 60_000) return;
  lastPruneAt = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding-window rate limiter per container instance.
 * Helps mitigate brute-force and burst abuse on serverless/Node runtimes.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);

  const windowStart = now - windowMs;
  const existing = rateLimitStore.get(key);
  const recent = existing
    ? existing.timestamps.filter((ts) => ts > windowStart)
    : [];

  if (recent.length >= maxRequests) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    rateLimitStore.set(key, {
      timestamps: recent,
      resetAt: oldest + windowMs,
    });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  recent.push(now);
  rateLimitStore.set(key, {
    timestamps: recent,
    resetAt: now + windowMs,
  });

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - recent.length),
    retryAfterSeconds: 0,
  };
}

export function buildRateLimitResponse(
  retryAfterSeconds: number,
  message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."
): NextResponse {
  return NextResponse.json(
    { error: message, retryAfterSeconds },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

