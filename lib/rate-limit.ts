import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let redis: Redis | null = null;
let authLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;
let webhookLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getAuthLimiter(): Ratelimit | null {
  if (authLimiter) return authLimiter;
  const r = getRedis();
  if (!r) return null;
  authLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:auth",
  });
  return authLimiter;
}

function getApiLimiter(): Ratelimit | null {
  if (apiLimiter) return apiLimiter;
  const r = getRedis();
  if (!r) return null;
  apiLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    prefix: "rl:api",
  });
  return apiLimiter;
}

function getWebhookLimiter(): Ratelimit | null {
  if (webhookLimiter) return webhookLimiter;
  const r = getRedis();
  if (!r) return null;
  webhookLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    prefix: "rl:webhook",
  });
  return webhookLimiter;
}

type RateLimitType = "auth" | "api" | "webhook";

function getLimiter(type: RateLimitType): Ratelimit | null {
  switch (type) {
    case "auth": return getAuthLimiter();
    case "api": return getApiLimiter();
    case "webhook": return getWebhookLimiter();
  }
}

export async function rateLimit(
  identifier: string,
  type: RateLimitType = "api",
): Promise<{ success: boolean; response?: NextResponse }> {
  const limiter = getLimiter(type);
  if (!limiter) return { success: true };

  const result = await limiter.limit(identifier);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Muitas requisições. Tente novamente em alguns instantes.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
            "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        },
      ),
    };
  }

  return { success: true };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
