import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { NOT_AN_IMAGE, TINY_PNG } from '../helpers/fixtures.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

const storage = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

vi.mock('../../src/config/cloudinary.js', () => ({
  isImageStorageEnabled: true,
  uploadImage: storage.uploadImage,
  deleteImage: storage.deleteImage,
}));

beforeEach(async () => {
  await resetDatabase();
  vi.clearAllMocks();
});
afterAll(disconnectDatabase);

describe('GET /users/:username', () => {
  it('returns a public profile without private fields', async () => {
    const { user } = await createSignedInClient({ username: 'liam' });
    const visitor = await createAnonymousClient();

    const res = await visitor.get('/users/LIAM');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      username: 'liam',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      isSelf: false,
      isFollowing: false,
    });
    expect(res.body.user).not.toHaveProperty('email');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('flags the signed-in user viewing their own profile', async () => {
    const client = await createSignedInClient();

    const res = await client.get(`/users/${client.user.username}`);

    expect(res.body.user.isSelf).toBe(true);
  });

  it('returns 404 for an unknown username', async () => {
    const client = await createAnonymousClient();

    const res = await client.get('/users/nobody_here');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /users/me', () => {
  it('updates display name, bio and banner color', async () => {
    const client = await createSignedInClient();

    const res = await client
      .patch('/users/me')
      .send({ displayName: '  Maya   Okafor ', bio: 'Hello\r\nworld', bannerColor: '#FF0088' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      displayName: 'Maya Okafor',
      bio: 'Hello\nworld',
      bannerColor: '#ff0088',
    });
  });

  it('rejects unknown fields and invalid values', async () => {
    const client = await createSignedInClient();

    const unknownField = await client.patch('/users/me').send({ username: 'hijack' });
    const badColor = await client.patch('/users/me').send({ bannerColor: 'red' });
    const longBio = await client.patch('/users/me').send({ bio: 'x'.repeat(161) });

    expect(unknownField.status).toBe(422);
    expect(badColor.status).toBe(422);
    expect(longBio.status).toBe(422);
  });

  it('requires authentication', async () => {
    const client = await createAnonymousClient();

    const res = await client.patch('/users/me').send({ bio: 'hi' });

    expect(res.status).toBe(401);
  });
});

describe('avatar upload', () => {
  it('uploads a new avatar and deletes the previous one', async () => {
    const client = await createSignedInClient();
    storage.uploadImage
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/a1.webp', publicId: 'a1' })
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/a2.webp', publicId: 'a2' });

    await client.put('/users/me/avatar').attach('avatar', TINY_PNG, 'me.png');
    const res = await client.put('/users/me/avatar').attach('avatar', TINY_PNG, 'me.png');

    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toBe('https://res.cloudinary.com/demo/a2.webp');
    expect(storage.deleteImage).toHaveBeenLastCalledWith('a1');
  });

  it('rejects files that are not images regardless of their claimed type', async () => {
    const client = await createSignedInClient();

    const res = await client
      .put('/users/me/avatar')
      .attach('avatar', NOT_AN_IMAGE, { filename: 'evil.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects images over the size limit', async () => {
    const client = await createSignedInClient();
    const oversized = Buffer.concat([TINY_PNG, Buffer.alloc(3 * 1024 * 1024)]);

    const res = await client.put('/users/me/avatar').attach('avatar', oversized, 'big.png');

    expect(res.status).toBe(413);
  });

  it('removes the avatar so clients fall back to initials', async () => {
    const client = await createSignedInClient();
    storage.uploadImage.mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/x.webp',
      publicId: 'x',
    });
    await client.put('/users/me/avatar').attach('avatar', TINY_PNG, 'me.png');

    const res = await client.delete('/users/me/avatar');

    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toBeNull();
    expect(storage.deleteImage).toHaveBeenLastCalledWith('x');
  });
});
