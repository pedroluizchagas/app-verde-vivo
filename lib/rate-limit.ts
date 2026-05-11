import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterName = "assistant" | "transcribe" | "checkout" | "push" | "webhook";

interface LimiterConfig {
  name: LimiterName;
  limit: number;
  windowSeconds: number;
  prefix: string;
}

const CONFIGS: Record<LimiterName, LimiterConfig> = {
  assistant: { name: "assistant", limit: 30, windowSeconds: 60, prefix: "rl:assistant" },
  transcribe: { name: "transcribe", limit: 10, windowSeconds: 300, prefix: "rl:transcribe" },
  checkout: { name: "checkout", limit: 5, windowSeconds: 60, prefix: "rl:checkout" },
  push: { name: "push", limit: 60, windowSeconds: 60, prefix: "rl:push" },
  webhook: { name: "webhook", limit: 1000, windowSeconds: 60, prefix: "rl:webhook" },
};

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "");
  if (!raw) return undefined;
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "");
  return unwrapped || undefined;
}

const upstashUrl = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_URL);
const upstashToken = normalizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN);
const isProduction = process.env.NODE_ENV === "production";
const rateLimitDisabled =
  normalizeEnvValue(process.env.RATE_LIMIT_DISABLED) === "true" && !isProduction;

let warnedMissingUpstash = false;
let warnedDisabled = false;

function getRedis(): Redis | null {
  if (rateLimitDisabled) {
    if (!warnedDisabled) {
      console.warn(
        "[rate-limit] RATE_LIMIT_DISABLED=true em ambiente não-produção: limiters em no-op.",
      );
      warnedDisabled = true;
    }
    return null;
  }
  if (!upstashUrl || !upstashToken) {
    if (!warnedMissingUpstash) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes: rate limiting desativado (no-op).",
      );
      warnedMissingUpstash = true;
    }
    return null;
  }
  return new Redis({ url: upstashUrl, token: upstashToken });
}

const limiters = new Map<LimiterName, Ratelimit | null>();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (limiters.has(name)) return limiters.get(name) ?? null;
  const redis = getRedis();
  if (!redis) {
    limiters.set(name, null);
    return null;
  }
  const cfg = CONFIGS[name];
  const limiter = new Ratelimit({
    redis,
    prefix: cfg.prefix,
    limiter: Ratelimit.slidingWindow(cfg.limit, `${cfg.windowSeconds} s`),
    analytics: false,
  });
  limiters.set(name, limiter);
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const cfg = CONFIGS[name];
  const limiter = getLimiter(name);
  if (!limiter) {
    return {
      ok: true,
      limit: cfg.limit,
      remaining: cfg.limit,
      reset: Date.now() + cfg.windowSeconds * 1000,
      retryAfterSeconds: 0,
    };
  }
  try {
    const result = await limiter.limit(identifier);
    const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    return {
      ok: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfterSeconds: retryAfter,
    };
  } catch (err) {
    console.error("[rate-limit] erro consultando Upstash, liberando passagem:", err);
    return {
      ok: true,
      limit: cfg.limit,
      remaining: cfg.limit,
      reset: Date.now() + cfg.windowSeconds * 1000,
      retryAfterSeconds: 0,
    };
  }
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = String(Math.max(1, result.retryAfterSeconds));
  return NextResponse.json(
    {
      error: "rate_limited",
      message: "Muitas requisições em pouco tempo. Tente novamente em alguns instantes.",
      retry_after_seconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter,
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
      },
    },
  );
}

export async function enforceRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(name, identifier);
  if (!result.ok) return rateLimitResponse(result);
  return null;
}

export function getClientIp(request: Request): string {
  const forwarded =
    request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "";
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
