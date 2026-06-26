import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { ApiError } from './api-error';
import { ZodError } from 'zod';
import { checkRateLimit, RateLimitConfig } from './rate-limit';

type HandlerWithoutContext = (req: Request) => Promise<Response>;
type HandlerWithContext<T> = (req: Request, context: T) => Promise<Response>;

interface ApiHandlerOptions {
  /** Optional rate limit configuration for this endpoint */
  rateLimit?: RateLimitConfig;
  /** Function to extract the rate limit identifier (default: IP from headers) */
  rateLimitKey?: (req: Request) => string;
}

/**
 * Wraps API route handlers with:
 * - Request correlation ID (X-Request-Id)
 * - Structured logging
 * - Sentry error tracking
 * - Optional rate limiting
 * - Zod / ApiError handling
 */
export function apiHandler(handler: HandlerWithoutContext, options?: ApiHandlerOptions): HandlerWithoutContext;
export function apiHandler<T>(handler: HandlerWithContext<T>, options?: ApiHandlerOptions): HandlerWithContext<T>;
export function apiHandler(handler: any, options?: ApiHandlerOptions) {
  return async (req: Request, context?: any) => {
    const requestId = crypto.randomUUID();

    // Extract method and path for logging
    const url = new URL(req.url);
    const reqLog = logger.child({ requestId, method: req.method, path: url.pathname });

    reqLog.info('API request started');

    try {
      // --- RATE LIMITING ---
      if (options?.rateLimit) {
        const identifier = options.rateLimitKey
          ? options.rateLimitKey(req)
          : getClientIp(req);

        const result = await checkRateLimit(identifier, options.rateLimit);
        if (!result.allowed) {
          reqLog.warn({ identifier, prefix: options.rateLimit.prefix }, 'Rate limit exceeded');
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(result.retryAfterSeconds ?? 60),
                'X-Request-Id': requestId,
              },
            }
          );
        }
      }

      // --- EXECUTE HANDLER ---
      const response = await handler(req, context);

      // Attach requestId to response headers
      const headers = new Headers(response.headers);
      headers.set('X-Request-Id', requestId);

      reqLog.info({ status: response.status }, 'API request completed');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error: unknown) {
      // --- STRUCTURED LOGGING ---
      reqLog.error({ err: error }, 'API Error');

      // --- SENTRY ---
      // Only capture unexpected errors, not business-logic ApiErrors (401, 403, 404, etc.)
      if (!(error instanceof ApiError)) {
        Sentry.captureException(error, {
          tags: { requestId },
        });
      }

      const headers = { 'X-Request-Id': requestId };

      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, requestId },
          { status: error.statusCode, headers }
        );
      }
      
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation Error', details: error.issues, requestId },
          { status: 400, headers }
        );
      }

      return NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500, headers }
      );
    }
  };
}

/**
 * Extract client IP from common reverse-proxy headers.
 * Falls back to 'unknown' if no IP can be determined.
 */
function getClientIp(req: Request): string {
  // X-Forwarded-For is the standard header set by load balancers/proxies
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Vercel-specific
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
