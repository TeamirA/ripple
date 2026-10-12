import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/utils/AppError.js';

describe('AppError', () => {
  it.each([
    ['badRequest', 400, 'BAD_REQUEST'],
    ['unauthorized', 401, 'UNAUTHORIZED'],
    ['forbidden', 403, 'FORBIDDEN'],
    ['notFound', 404, 'NOT_FOUND'],
    ['conflict', 409, 'CONFLICT'],
    ['tooManyRequests', 429, 'RATE_LIMITED'],
  ])('%s builds a %i error with code %s', (factory, statusCode, code) => {
    const error = AppError[factory]();

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe(code);
  });

  it('keeps validation details', () => {
    const details = [{ path: 'email', message: 'Invalid email' }];
    const error = AppError.validation(details);

    expect(error.statusCode).toBe(422);
    expect(error.details).toBe(details);
  });
});
