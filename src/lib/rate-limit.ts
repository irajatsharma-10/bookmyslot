import redis from './redis';
import { logger } from './logger';

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing (e.g., 'register', 'payment') */
  prefix: string;
  /** If true, reject the request when Redis is unavailable. Default: false (fail open) */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Sliding-window rate limiter backed by Redis.
 * Uses INCR + EXPIRE for atomic counter with TTL.
 *
 * @param identifier - The key to rate limit on (e.g., IP address, userId)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rate_limit:${config.prefix}:${identifier}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, config.windowSeconds);
    const results = await pipeline.exec();

    if (!results || !results[0]) {
      // Pipeline failed — fall through to fail behavior
      throw new Error('Redis pipeline returned no results');
    }

    const [incrErr, count] = results[0];
    if (incrErr) throw incrErr;

    const currentCount = count as number;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    if (currentCount > config.maxRequests) {
      // Get TTL for Retry-After header
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: ttl > 0 ? ttl : config.windowSeconds,
      };
    }

    return { allowed: true, remaining };
  } catch (err) {
    logger.error({ err, key }, 'Rate limit check failed');

    if (config.failClosed) {
      // For financial endpoints: deny if Redis is unavailable
      return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
    }

    // For non-financial endpoints: allow through if Redis is unavailable
    return { allowed: true, remaining: config.maxRequests };
  }
}
