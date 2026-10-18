import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { collectAllPages, createPost } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

const HOUR = 60 * 60 * 1000;

async function backdatePost(postId, hoursAgo) {
  await prisma.post.update({
    where: { id: postId },
    data: { createdAt: new Date(Date.now() - hoursAgo * HOUR) },
  });
}

async function likeWith(clients, postId) {
  for (const client of clients) await client.put(`/posts/${postId}/like`);
}

describe('GET /feed/following', () => {
  it('shows my posts and posts from people I follow, newest first', async () => {
    const me = await createSignedInClient();
    const friend = await createSignedInClient();
    const stranger = await createSignedInClient();
    await me.put(`/users/${friend.user.username}/follow`);

    await createPost(friend, 'friend old');
    await createPost(stranger, 'stranger');
    await createPost(me, 'mine');
    await createPost(friend, 'friend new');

    const posts = await collectAllPages(me, '/feed/following', 2);

    expect(posts.map((post) => post.content)).toEqual(['friend new', 'mine', 'friend old']);
  });

  it('includes the viewer’s like state on each post', async () => {
    const me = await createSignedInClient();
    const post = await createPost(me);
    await me.put(`/posts/${post.id}/like`);

    const res = await me.get('/feed/following');

    expect(res.body.data[0]).toMatchObject({ id: post.id, hasLiked: true, likesCount: 1 });
  });

  it('requires authentication', async () => {
    const res = await (await createAnonymousClient()).get('/feed/following');

    expect(res.status).toBe(401);
  });
});

describe('GET /feed/explore', () => {
  it('lists every post newest first for anonymous visitors', async () => {
    const author = await createSignedInClient();
    for (const content of ['one', 'two', 'three']) await createPost(author, content);

    const posts = await collectAllPages(await createAnonymousClient(), '/feed/explore', 2);

    expect(posts.map((post) => post.content)).toEqual(['three', 'two', 'one']);
    expect(posts[0].hasLiked).toBe(false);
  });

  it('ranks trending posts by likes within the last 48 hours', async () => {
    const author = await createSignedInClient();
    const fans = await Promise.all([1, 2, 3].map(() => createSignedInClient()));
    const popular = await createPost(author, 'popular');
    const lukewarm = await createPost(author, 'lukewarm');
    const quiet = await createPost(author, 'quiet');
    const stale = await createPost(author, 'stale but loved');

    await likeWith(fans, popular.id);
    await likeWith(fans.slice(0, 1), lukewarm.id);
    await likeWith(fans, stale.id);
    await backdatePost(stale.id, 72);

    const posts = await collectAllPages(author, '/feed/explore?sort=trending', 2);

    expect(posts.map((post) => post.content)).toEqual(['popular', 'lukewarm', 'quiet']);
    expect(posts.map((post) => post.id)).not.toContain(stale.id);
    expect(quiet.likesCount).toBe(0);
  });

  it('rejects an unknown sort', async () => {
    const res = await (await createAnonymousClient()).get('/feed/explore?sort=random');

    expect(res.status).toBe(422);
  });
});
