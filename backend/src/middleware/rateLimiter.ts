import { Request, Response, NextFunction } from "express";
import { redisClient } from "../queues/redisStream";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Redis-based sliding window rate limiter.
 *
 * Uses INCR + EXPIRE on a per-IP key.
 * Allows RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS window.
 *
 * Concurrency-safe: Redis is single-threaded, INCR is atomic.
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip ?? "unknown";
  const key = `ratelimit:${ip}`;

  try {
    const current = await redisClient.incr(key);

    // Set TTL only on first request in window
    if (current === 1) {
      await redisClient.pexpire(key, config.rateLimitWindowMs);
    }

    res.setHeader("X-RateLimit-Limit", config.rateLimitMax);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, config.rateLimitMax - current));

    if (current > config.rateLimitMax) {
      logger.warn(`[RATE LIMIT] IP ${ip} exceeded limit (${current}/${config.rateLimitMax})`);
      res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit: ${config.rateLimitMax} requests per ${config.rateLimitWindowMs / 1000}s`,
        retryAfterMs: config.rateLimitWindowMs,
      });
      return;
    }

    next();
  } catch (err) {
    // If Redis is down, fail open (degrade gracefully — don't block ingestion)
    logger.error("[RATE LIMIT] Redis error — failing open", { error: (err as Error).message });
    next();
  }
}
