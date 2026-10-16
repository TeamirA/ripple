import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { collectAllPages, createComment, createPost } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

async function getCounts(postId) {
  return prisma.post.findUnique({ where: { id: postId }, select: { commentsCount: true } });
}

describe('POST /posts/:postId/comments', () => {
  it('adds a comment and increments the post comment count', async () => {
    const author = await createSignedInClient();
    const post = await createPost(author);
    const commenter = await createSignedInClient();

    const res = await commenter.post(`/posts/${post.id}/comments`).send({ content: 'Great!' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({
      content: 'Great!',
      parentId: null,
      postId: post.id,
      author: { id: commenter.user.id },
    });
    expect(await getCounts(post.id)).toEqual({ commentsCount: 1 });
  });

  it('flattens replies to replies onto the top-level comment', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client);
    const top = await createComment(client, post.id, 'Top');
    const reply = await createComment(client, post.id, 'Reply', top.id);

    const nested = await createComment(client, post.id, 'Reply to reply', reply.id);

    expect(nested.parentId).toBe(top.id);
    const parent = await prisma.comment.findUnique({ where: { id: top.id } });
    expect(parent.repliesCount).toBe(2);
  });

  it('rejects a parent comment from another post', async () => {
    const client = await createSignedInClient();
    const postA = await createPost(client, 'A');
    const postB = await createPost(client, 'B');
    const commentOnA = await createComment(client, postA.id);

    const res = await client
      .post(`/posts/${postB.id}/comments`)
      .send({ content: 'Sneaky', parentId: commentOnA.id });

    expect(res.status).toBe(422);
  });

  it('returns 404 when the post does not exist', async () => {
    const client = await createSignedInClient();

    const res = await client
      .post('/posts/clxxxxxxxxxxxxxxxxxxxxxxx/comments')
      .send({ content: 'Hello?' });

    expect(res.status).toBe(404);
  });
});

describe('GET /posts/:postId/comments', () => {
  it('lists top-level comments oldest first with a reply preview', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client);
    const first = await createComment(client, post.id, 'First');
    await createComment(client, post.id, 'Second');
    for (let index = 0; index < 4; index += 1) {
      await createComment(client, post.id, `Reply ${index}`, first.id);
    }

    const res = await (await createAnonymousClient()).get(`/posts/${post.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((comment) => comment.content)).toEqual(['First', 'Second']);
    expect(res.body.data[0].repliesCount).toBe(4);
    expect(res.body.data[0].replies.map((reply) => reply.content)).toEqual([
      'Reply 0',
      'Reply 1',
      'Reply 2',
    ]);
  });

  it('paginates the full reply list', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client);
    const top = await createComment(client, post.id);
    for (let index = 0; index < 5; index += 1) {
      await createComment(client, post.id, `Reply ${index}`, top.id);
    }

    const replies = await collectAllPages(client, `/comments/${top.id}/replies`, 2);

    expect(replies).toHaveLength(5);
    expect(new Set(replies.map((reply) => reply.id)).size).toBe(5);
  });
});

describe('DELETE /comments/:commentId', () => {
  it('removes a top-level comment with its replies and fixes the counters', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client);
    const top = await createComment(client, post.id);
    await createComment(client, post.id, 'reply 1', top.id);
    await createComment(client, post.id, 'reply 2', top.id);
    await createComment(client, post.id, 'other');

    const res = await client.delete(`/comments/${top.id}`);

    expect(res.status).toBe(204);
    expect(await getCounts(post.id)).toEqual({ commentsCount: 1 });
    expect(await prisma.comment.count()).toBe(1);
  });

  it('removes a reply and decrements the parent reply count', async () => {
    const client = await createSignedInClient();
    const post = await createPost(client);
    const top = await createComment(client, post.id);
    const reply = await createComment(client, post.id, 'reply', top.id);

    await client.delete(`/comments/${reply.id}`);

    const parent = await prisma.comment.findUnique({ where: { id: top.id } });
    expect(parent.repliesCount).toBe(0);
    expect(await getCounts(post.id)).toEqual({ commentsCount: 1 });
  });

  it('lets the post author moderate but forbids other users', async () => {
    const postAuthor = await createSignedInClient();
    const post = await createPost(postAuthor);
    const commenter = await createSignedInClient();
    const stranger = await createSignedInClient();
    const comment = await createComment(commenter, post.id);

    expect((await stranger.delete(`/comments/${comment.id}`)).status).toBe(403);
    expect((await postAuthor.delete(`/comments/${comment.id}`)).status).toBe(204);
  });
});
