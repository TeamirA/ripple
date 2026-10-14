import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { createRateLimiter } from '../../src/middlewares/rateLimiter.js';

describe('createRateLimiter', () => {
  it('answers with the standard error shape once the limit is reached', async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, limit: 2, enabled: true }));
    app.get('/', (_req, res) => res.send('ok'));
    app.use(errorHandler);

    await request(app).get('/');
    await request(app).get('/');
    const res = await request(app).get('/');

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
