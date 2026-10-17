import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { collectAllPages } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

async function getCounts(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { followersCount: true, followingCount: true },
  });
}

async function follow(client, target) {
  const res = await client.put(`/users/${target.user.username}/follow`);
  if (res.status !== 200) throw new Error(res.text);
}

describe('follow and unfollow', () => {
  it('updates both users’ counters and the profile follow state', async () => {
    const alice = await createSignedInClient();
    const bob = await createSignedInClient();

    const followed = await alice.put(`/users/${bob.user.username}/follow`);
    const profile = await alice.get(`/users/${bob.user.username}`);

    expect(followed.body).toEqual({ isFollowing: true, followersCount: 1 });
    expect(profile.body.user.isFollowing).toBe(true);
    expect(await getCounts(alice.user.id)).toEqual({ followersCount: 0, followingCount: 1 });
    expect(await getCounts(bob.user.id)).toEqual({ followersCount: 1, followingCount: 0 });

    const unfollowed = await alice.delete(`/users/${bob.user.username}/follow`);

    expect(unfollowed.body).toEqual({ isFollowing: false, followersCount: 0 });
    expect(await getCounts(alice.user.id)).toEqual({ followersCount: 0, followingCount: 0 });
  });

  it('is idempotent', async () => {
    const alice = await createSignedInClient();
    const bob = await createSignedInClient();

    await Promise.all([follow(alice, bob), follow(alice, bob)]);

    expect(await getCounts(bob.user.id)).toEqual({ followersCount: 1, followingCount: 0 });
  });

  it('rejects following yourself and unknown users', async () => {
    const alice = await createSignedInClient();

    expect((await alice.put(`/users/${alice.user.username}/follow`)).status).toBe(400);
    expect((await alice.put('/users/ghost_user/follow')).status).toBe(404);
  });
});

describe('followers and following lists', () => {
  it('paginates followers with the viewer’s follow state', async () => {
    const star = await createSignedInClient();
    const fans = [];
    for (let index = 0; index < 3; index += 1) {
      const fan = await createSignedInClient();
      await follow(fan, star);
      fans.push(fan);
    }
    await follow(fans[0], fans[1]);

    const followers = await collectAllPages(fans[0], `/users/${star.user.username}/followers`, 2);

    expect(followers.map((user) => user.id)).toEqual(fans.map((fan) => fan.user.id).reverse());
    const byId = new Map(followers.map((user) => [user.id, user]));
    expect(byId.get(fans[1].user.id).isFollowing).toBe(true);
    expect(byId.get(fans[0].user.id).isSelf).toBe(true);
  });

  it('lists who a user follows', async () => {
    const alice = await createSignedInClient();
    const bob = await createSignedInClient();
    await follow(alice, bob);

    const res = await (
      await createAnonymousClient()
    ).get(`/users/${alice.user.username}/following`);

    expect(res.body.data.map((user) => user.username)).toEqual([bob.user.username]);
    expect(res.body.data[0]).not.toHaveProperty('email');
  });
});

describe('GET /users/suggestions', () => {
  it('ranks friends-of-friends first, then fills with the most-followed users', async () => {
    const me = await createSignedInClient();
    const friend = await createSignedInClient();
    const friendOfFriend = await createSignedInClient();
    const popular = await createSignedInClient();
    const others = await Promise.all([createSignedInClient(), createSignedInClient()]);

    await follow(me, friend);
    await follow(friend, friendOfFriend);
    for (const other of others) await follow(other, popular);

    const res = await me.get('/users/suggestions?limit=3');

    const usernames = res.body.data.map((user) => user.username);
    expect(usernames[0]).toBe(friendOfFriend.user.username);
    expect(usernames[1]).toBe(popular.user.username);
    expect(usernames).not.toContain(me.user.username);
    expect(usernames).not.toContain(friend.user.username);
    expect(res.body.data).toHaveLength(3);
  });

  it('returns the most-followed users to anonymous visitors', async () => {
    const popular = await createSignedInClient();
    const fan = await createSignedInClient();
    await follow(fan, popular);

    const res = await (await createAnonymousClient()).get('/users/suggestions');

    expect(res.body.data[0].username).toBe(popular.user.username);
  });
});
