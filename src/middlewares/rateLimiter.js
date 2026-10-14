import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const MINUTE = 60 * 1000;

/** Builds a limiter that answers with the standard error shape. Disabled in tests by default. */
export function createRateLimiter({ windowMs, limit, enabled = !env.isTest }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => !enabled,
    // Signed-in users get their own bucket so a shared IP (office, campus) is not penalized.
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
    handler: (_req, _res, next) => next(AppError.tooManyRequests()),
  });
}

export const authRateLimiter = createRateLimiter({ windowMs: 15 * MINUTE, limit: 20 });
export const writeRateLimiter = createRateLimiter({ windowMs: MINUTE, limit: 60 });
