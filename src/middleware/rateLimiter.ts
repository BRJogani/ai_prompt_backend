import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '@config/env';
import { RateLimitError } from '@utils/ApiError';

/**
 * Shared handler that funnels rate-limit rejections through the same
 * ApiError -> errorHandler pipeline as every other error, keeping the
 * response shape consistent ({ success: false, message, errors }).
 */
function rateLimitHandler(_req: Request, res: Response): void {
  const error = new RateLimitError();
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: [],
  });
}

/**
 * Default limiter applied to all public `/api/v1` traffic.
 * Configurable via RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX (defaults: 100 req/min/IP).
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Tighter limiter intended for sensitive/high-abuse-risk endpoints
 * (e.g. admin login in later phases, analytics event ingestion).
 * Kept here so it's ready to import once those routes exist.
 */
export const strictRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(10, Math.floor(env.RATE_LIMIT_MAX / 5)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export default globalRateLimiter;
