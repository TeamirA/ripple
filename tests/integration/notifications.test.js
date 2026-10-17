import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { createComment, createPost } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

async function listTypes(client) {
  const res = await client.get('/notifications');
  return res.body.data.map((notification) => notification.type);
}

describe('notifications', () => {
  it('notifies about follows, likes, comments and replies, newest first', async () => {
    const author = await createSignedInClient();
    const fan = await createSignedInClient();
    const post = await createPost(author, 'My post');

    await fan.put(`/users/${author.user.username}/follow`);
    await fan.put(`/posts/${post.id}/like`);
    const authorComment = await createComment(author, post.id, 'Thoughts?');
    await createComment(fan, post.id, 'Love it', authorComment.id);

    const res = await author.get('/notifications');

    expect(res.body.data.map((n) => n.type)).toEqual(['REPLY', 'LIKE', 'FOLLOW']);
    expect(res.body.data[0]).toMatchObject({
      isRead: false,
      actor: { id: fan.user.id },
      post: { id: post.id, preview: 'My post' },
      comment: { preview: 'Love it' },
    });
  });

  it('notifies the post author about new comments', async () => {
    const author = await createSignedInClient();
    const post = await createPost(author);
    const commenter = await createSignedInClient();

    await createComment(commenter, post.id);

    expect(await listTypes(author)).toEqual(['COMMENT']);
  });

  it('never notifies users about their own actions', async () => {
    const author = await createSignedInClient();
    const post = await createPost(author);

    await author.put(`/posts/${post.id}/like`);
    await createComment(author, post.id);

    expect(await listTypes(author)).toEqual([]);
  });

  it('withdraws the notification when a like or follow is undone', async () => {
    const author = await createSignedInClient();
    const post = await createPost(author);
    const fan = await createSignedInClient();

    await fan.put(`/posts/${post.id}/like`);
    await fan.put(`/users/${author.user.username}/follow`);
    await fan.delete(`/posts/${post.id}/like`);
    await fan.delete(`/users/${author.user.username}/follow`);

    expect(await listTypes(author)).toEqual([]);
  });

  it('tracks the unread count and marks everything read', async () => {
    const author = await createSignedInClient();
    const fans = await Promise.all([createSignedInClient(), createSignedInClient()]);
    for (const fan of fans) await fan.put(`/users/${author.user.username}/follow`);

    const before = await author.get('/notifications/unread-count');
    const markRead = await author.post('/notifications/read-all');
    const after = await author.get('/notifications/unread-count');

    expect(before.body.unreadCount).toBe(2);
    expect(markRead.status).toBe(204);
    expect(after.body.unreadCount).toBe(0);
  });

  it('requires authentication', async () => {
    const visitor = await createAnonymousClient();

    expect((await visitor.get('/notifications')).status).toBe(401);
  });
});
