import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../../src/middlewares/validateRequest.js';

function run(middleware, req) {
  const next = vi.fn();
  middleware(req, {}, next);
  return next.mock.calls[0][0];
}

describe('validateRequest', () => {
  const middleware = validateRequest({
    body: z.object({ name: z.string().trim().min(1) }),
    query: z.object({ limit: z.coerce.number().int().default(20) }),
  });

  it('replaces request parts with parsed values', () => {
    const req = { body: { name: '  Ripple  ' }, query: {} };

    const error = run(middleware, req);

    expect(error).toBeUndefined();
    expect(req.body).toEqual({ name: 'Ripple' });
    expect(req.query).toEqual({ limit: 20 });
  });

  it('collects issues from every part into one validation error', () => {
    const error = run(middleware, { body: { name: '' }, query: { limit: 'abc' } });

    expect(error.statusCode).toBe(422);
    expect(error.details.map((d) => d.field)).toEqual(['query.limit', 'body.name']);
  });
});
