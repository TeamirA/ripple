import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { collectAllPages, createPost } from '../helpers/factories.js';
import { TINY_PNG } from '../helpers/fixtures.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

const storage = vi.hoisted(() => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }));

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

describe('POST /posts', () => {
  it('creates a text post and increments the author post count', async () => {
    const client = await createSignedInClient();

    const res = await client.post('/posts').send({ content: '  First post!  ' });

    expect(res.status).toBe(201);
    expect(res.body.post).toMatchObject({
      content: 'First post!',
      imageUrl: null,
      likesCount: 0,
      commentsCount: 0,
      hasLiked: false,
      editedAt: null,
      author: { id: client.user.id, username: client.user.username },
    });
    const author = await prisma.user.findUnique({ where: { id: client.user.id } });
    expect(author.postsCount).toBe(1);
  });

  it('creates a post with an image via multipart form data', async () => {
    const client = await createSignedInClient();
    storage.uploadImage.mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/demo/post.webp',
      publicId: 'post-1',
    });

    const res = await client
      .post('/posts')
      .field('content', 'Look at this')
      .attach('image', TINY_PNG, 'photo.png');

    expect(res.status).toBe(201);
    expect(res.body.post.imageUrl).toBe('https://res.cloudinary.com/demo/post.webp');
  });

  it('enforces the 500 character limit and rejects empty posts', async () => {
    const client = await createSignedInClient();

    const tooLong = await client.post('/posts').send({ content: 'x'.repeat(501) });
    const empty = await client.post('/posts').send({ content: '   ' });
    const exactly500 = await client.post('/posts').send({ content: 'x'.repeat(500) });

    expect(tooLong.status).toBe(422);
    expect(empty.status).toBe(422);
    expect(exactly500.status).toBe(201);
  });

  it('stores HTML as plain text for render-time escaping', async () => {
    const client = await createSignedInClient();

    const post = await createPost(client, '<img src=x onerror=alert(1)>');

    expect(post.content).toBe('<img src=x onerror=alert(1)>');
  });

  it('requires authentication', async () => {
    const client = await createAnonymousClient();

    const res = await client.post('/posts').send({ content: 'hi' });

    expect(res.status).toBe(401);
  });
});

describe('GET /posts/:postId', () => {
  it('returns the post to anonymous visitors', async () => {
    const post = await createPost(await createSignedInClient());

    const res = await (await createAnonymousClient()).get(`/posts/${post.id}`);

    expect(res.status).toBe(200);
    expect(res.body.post.id).toBe(post.id);
  });

  it('returns 404 for a missing post and 422 for a malformed id', async () => {
    const client = await createAnonymousClient();

    expect((await client.get('/posts/clxxxxxxxxxxxxxxxxxxxxxxx')).status).toBe(404);
    expect((await client.get('/posts/not-an-id')).status).toBe(422);
  });
});

describe('PATCH /posts/:postId', () => {
  it('lets the author edit and marks the post as edited', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client, 'Typo hree');

    const res = await client.patch(`/posts/${post.id}`).send({ content: 'Typo here' });

    expect(res.status).toBe(200);
    expect(res.body.post.content).toBe('Typo here');
    expect(res.body.post.editedAt).not.toBeNull();
  });

  it('forbids editing someone else’s post', async () => {
    const post = await createPost(await createSignedInClient());
    const intruder = await createSignedInClient();

    const res = await intruder.patch(`/posts/${post.id}`).send({ content: 'hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /posts/:postId', () => {
  it('deletes the post, its image and decrements the post count', async () => {
    const client = await createSignedInClient();
    storage.uploadImage.mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/p.webp',
      publicId: 'p',
    });
    const created = await client
      .post('/posts')
      .field('content', 'bye')
      .attach('image', TINY_PNG, 'p.png');

    const res = await client.delete(`/posts/${created.body.post.id}`);

    expect(res.status).toBe(204);
    expect(storage.deleteImage).toHaveBeenCalledWith('p');
    expect(await prisma.post.count()).toBe(0);
    const author = await prisma.user.findUnique({ where: { id: client.user.id } });
    expect(author.postsCount).toBe(0);
  });

  it('forbids deleting someone else’s post', async () => {
    const post = await createPost(await createSignedInClient());
    const intruder = await createSignedInClient();

    const res = await intruder.delete(`/posts/${post.id}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /users/:username/posts', () => {
  it('paginates a user’s posts newest first without gaps or duplicates', async () => {
    const author = await createSignedInClient();
    const created = [];
    for (let index = 0; index < 5; index += 1) {
      created.push(await createPost(author, `Post ${index}`));
    }

    const items = await collectAllPages(author, `/users/${author.user.username}/posts`, 2);

    expect(items.map((post) => post.content)).toEqual([
      'Post 4',
      'Post 3',
      'Post 2',
      'Post 1',
      'Post 0',
    ]);
  });

  it('rejects a tampered cursor', async () => {
    const author = await createSignedInClient();

    const res = await author.get(`/users/${author.user.username}/posts?cursor=garbage`);

    expect(res.status).toBe(400);
  });
});
