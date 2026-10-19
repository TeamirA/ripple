import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../helpers/testClient.js';

describe('client app shell', () => {
  it.each(['/', '/explore', '/u/maya_codes', '/p/clxxxxxxxxxxxxxxxxxxxxxxx'])(
    'serves index.html for the client route %s',
    async (path) => {
      const res = await request(app).get(path);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.headers['cache-control']).toBe('no-cache');
      expect(res.text).toContain('<div class="app-shell"');
    },
  );

  it('serves static assets with cache headers', async () => {
    const res = await request(app).get('/js/main.js');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.headers['cache-control']).toMatch(/max-age=\d+/);
  });

  it('returns 404 for missing assets instead of the app shell', async () => {
    const res = await request(app).get('/js/missing.js');

    expect(res.status).toBe(404);
  });

  it('compresses responses', async () => {
    const res = await request(app).get('/css/variables.css').set('Accept-Encoding', 'gzip');

    expect(res.headers['content-encoding']).toBe('gzip');
  });
});
