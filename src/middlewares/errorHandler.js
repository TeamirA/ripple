import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

const PRISMA_ERRORS = {
  P2002: () => AppError.conflict('A record with that value already exists'),
  P2025: () => AppError.notFound(),
};

/** Maps known library errors onto AppError so every response has the same shape. */
function normalizeError(err) {
  if (err instanceof AppError) return err;
  if (err.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON body');
  if (err.type === 'entity.too.large')
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  if (typeof err.code === 'string' && PRISMA_ERRORS[err.code]) return PRISMA_ERRORS[err.code]();
  return null;
}

// Express identifies error middleware by its four-argument signature.
export function errorHandler(err, req, res, _next) {
  const appError = normalizeError(err);

  if (!appError) {
    (req.log ?? logger).error({ err }, 'Unhandled error');
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end' },
    });
  }

  const { statusCode, code, message, details } = appError;
  return res.status(statusCode).json({ error: { code, message, ...(details && { details }) } });
}
