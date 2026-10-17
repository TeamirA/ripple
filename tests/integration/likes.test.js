import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createComment, createPost } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('post likes', () => {
  it('likes and unlikes a post, keeping the counter in sync', async () => {
    const post = await createPost(await createSignedInClient());
    const fan = await createSignedInClient();

    const liked = await fan.put(`/posts/${post.id}/like`);
    const viewed = await fan.get(`/posts/${post.id}`);
    const unliked = await fan.delete(`/posts/${post.id}/like`);

    expect(liked.body).toEqual({ likesCount: 1, hasLiked: true });
    expect(viewed.body.post).toMatchObject({ likesCount: 1, hasLiked: true });
    expect(unliked.body).toEqual({ likesCount: 0, hasLiked: false });
  });

  it('is idempotent, even under concurrent requests', async () => {
    const post = await createPost(await createSignedInClient());
    const fan = await createSignedInClient();

    const responses = await Promise.all([
      fan.put(`/posts/${post.id}/like`),
      fan.put(`/posts/${post.id}/like`),
      fan.put(`/posts/${post.id}/like`),
    ]);
    await fan.delete(`/posts/${post.id}/like`);
    const secondUnlike = await fan.delete(`/posts/${post.id}/like`);

    expect(responses.every((res) => res.status === 200)).toBe(true);
    expect(await prisma.like.count()).toBe(0);
    expect(secondUnlike.body.likesCount).toBe(0);
  });

  it('counts likes from different users', async () => {
    const post = await createPost(await createSignedInClient());
    const fans = await Promise.all([createSignedInClient(), createSignedInClient()]);

    await Promise.all(fans.map((fan) => fan.put(`/posts/${post.id}/like`)));

    const stored = await prisma.post.findUnique({ where: { id: post.id } });
    expect(stored.likesCount).toBe(2);
  });

  it('returns 404 for a missing post and 401 when signed out', async () => {
    const fan = await createSignedInClient();
    const visitor = await createAnonymousClient();
    const post = await createPost(fan);

    expect((await fan.put('/posts/clxxxxxxxxxxxxxxxxxxxxxxx/like')).status).toBe(404);
    expect((await visitor.put(`/posts/${post.id}/like`)).status).toBe(401);
  });
});

describe('comment likes', () => {
  it('likes and unlikes a comment and reflects hasLiked in threads', async () => {
    const author = await createSignedInClient();
    const post = await createPost(author);
    const comment = await createComment(author, post.id);
    const fan = await createSignedInClient();

    const liked = await fan.put(`/comments/${comment.id}/like`);
    const thread = await fan.get(`/posts/${post.id}/comments`);
    const unliked = await fan.delete(`/comments/${comment.id}/like`);

    expect(liked.body).toEqual({ likesCount: 1, hasLiked: true });
    expect(thread.body.data[0]).toMatchObject({ likesCount: 1, hasLiked: true });
    expect(unliked.body).toEqual({ likesCount: 0, hasLiked: false });
  });
});
