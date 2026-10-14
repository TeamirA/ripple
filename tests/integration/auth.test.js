import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import {
  app,
  buildUserInput,
  createAnonymousClient,
  createSignedInClient,
  request,
} from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('POST /auth/register', () => {
  it('creates an account, normalizes identity fields and starts a session', async () => {
    const client = await createAnonymousClient();
    const input = buildUserInput({ email: 'Maya@Example.com ', username: 'Maya_Codes' });

    const res = await client.post('/auth/register').send(input);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'maya@example.com', username: 'maya_codes' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const sessionCookie = res.headers['set-cookie'].find((c) => c.startsWith('ripple_session='));
    expect(sessionCookie).toMatch(/HttpOnly/);
    expect(sessionCookie).toMatch(/SameSite=Lax/);

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe('maya_codes');
  });

  it('stores a bcrypt hash instead of the password', async () => {
    const client = await createSignedInClient();

    const stored = await prisma.user.findUnique({ where: { id: client.user.id } });

    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(client.password);
  });

  it('rejects duplicate emails and usernames with field details', async () => {
    const existing = await createSignedInClient({ email: 'taken@example.com', username: 'taken' });
    const client = await createAnonymousClient();

    const res = await client
      .post('/auth/register')
      .send(buildUserInput({ email: existing.user.email, username: existing.user.username }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.details.map((d) => d.field)).toEqual(['body.email', 'body.username']);
  });

  it('validates the request body', async () => {
    const client = await createAnonymousClient();

    const res = await client
      .post('/auth/register')
      .send({ email: 'not-an-email', username: 'a!', displayName: '', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['body.email', 'body.username', 'body.displayName', 'body.password']),
    );
  });
});

describe('POST /auth/login', () => {
  it('signs in with either email or username', async () => {
    const { user, password } = await createSignedInClient();

    for (const identifier of [user.email, user.username.toUpperCase()]) {
      const client = await createAnonymousClient();
      const res = await client.post('/auth/login').send({ identifier, password });

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
    }
  });

  it('returns the same error for an unknown user and a wrong password', async () => {
    const { user } = await createSignedInClient();
    const client = await createAnonymousClient();

    const wrongPassword = await client
      .post('/auth/login')
      .send({ identifier: user.username, password: 'nope-nope-nope' });
    const unknownUser = await client
      .post('/auth/login')
      .send({ identifier: 'ghost', password: 'nope-nope-nope' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });
});

describe('session lifecycle', () => {
  it('rejects /auth/me without a session', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('ignores a tampered session cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'ripple_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.');

    expect(res.status).toBe(401);
  });

  it('logs out by clearing the session cookie', async () => {
    const client = await createSignedInClient();

    const logout = await client.post('/auth/logout');
    const me = await client.get('/auth/me');

    expect(logout.status).toBe(204);
    expect(me.status).toBe(401);
  });
});

describe('PATCH /auth/password', () => {
  it('changes the password, keeps this session and revokes the others', async () => {
    const client = await createSignedInClient();
    const otherDevice = await createAnonymousClient();
    await otherDevice
      .post('/auth/login')
      .send({ identifier: client.user.username, password: client.password });

    const res = await client
      .patch('/auth/password')
      .send({ currentPassword: client.password, newPassword: 'a-brand-new-password' });

    expect(res.status).toBe(204);
    expect((await client.get('/auth/me')).status).toBe(200);
    expect((await otherDevice.get('/auth/me')).status).toBe(401);

    const relogin = await (
      await createAnonymousClient()
    )
      .post('/auth/login')
      .send({ identifier: client.user.username, password: 'a-brand-new-password' });
    expect(relogin.status).toBe(200);
  });

  it('requires the correct current password', async () => {
    const client = await createSignedInClient();

    const res = await client
      .patch('/auth/password')
      .send({ currentPassword: 'wrong-password', newPassword: 'a-brand-new-password' });

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('body.currentPassword');
  });
});

describe('POST /auth/demo', () => {
  it('signs in as the demo account when it exists', async () => {
    await createSignedInClient({ username: 'demo' });
    const client = await createAnonymousClient();

    const res = await client.post('/auth/demo');

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('demo');
  });

  it('returns 404 when the demo account has not been seeded', async () => {
    const client = await createAnonymousClient();

    const res = await client.post('/auth/demo');

    expect(res.status).toBe(404);
  });
});

describe('CSRF protection', () => {
  it('rejects state-changing requests without the CSRF header', async () => {
    const agent = request.agent(app);
    await agent.get('/api/v1/auth/csrf');

    const res = await agent.post('/api/v1/auth/login').send({ identifier: 'a', password: 'b' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/CSRF/);
  });

  it('rejects a header that does not match the cookie', async () => {
    const agent = request.agent(app);
    await agent.get('/api/v1/auth/csrf');

    const res = await agent
      .post('/api/v1/auth/login')
      .set('X-CSRF-Token', 'forged-token')
      .send({ identifier: 'a', password: 'b' });

    expect(res.status).toBe(403);
  });
});
