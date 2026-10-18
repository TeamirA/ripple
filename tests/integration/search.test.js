import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { collectAllPages, createPost } from '../helpers/factories.js';
import { createAnonymousClient, createSignedInClient } from '../helpers/testClient.js';

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe('GET /search/users', () => {
  it('matches usernames and display names, best match first', async () => {
    await createSignedInClient({ username: 'mayan_history', displayName: 'History Buff' });
    await createSignedInClient({ username: 'maya', displayName: 'Maya Okafor' });
    await createSignedInClient({ username: 'codes_daily', displayName: 'Maya Lin' });
    await createSignedInClient({ username: 'unrelated', displayName: 'Someone Else' });

    const res = await (await createAnonymousClient()).get('/search/users?q=Maya');

    expect(res.status).toBe(200);
    const usernames = res.body.data.map((user) => user.username);
    expect(usernames[0]).toBe('maya');
    expect(usernames).toEqual(expect.arrayContaining(['mayan_history', 'codes_daily']));
    expect(usernames).not.toContain('unrelated');
  });

  it('treats LIKE wildcards literally', async () => {
    await createSignedInClient({ username: 'plain_user' });

    const res = await (await createAnonymousClient()).get('/search/users?q=%25');

    expect(res.body.data).toEqual([]);
  });

  it('requires a query', async () => {
    const res = await (await createAnonymousClient()).get('/search/users?q=%20%20');

    expect(res.status).toBe(422);
  });
});

describe('GET /search/posts', () => {
  it('finds posts by stemmed keywords and partial words', async () => {
    const author = await createSignedInClient();
    await createPost(author, 'Went running by the river this morning');
    await createPost(author, 'Postgres indexes make queries fast');
    await createPost(author, 'Nothing to see here');
    const client = await createAnonymousClient();

    const stemmed = await client.get('/search/posts?q=runs');
    const partial = await client.get('/search/posts?q=postgr');

    expect(stemmed.body.data.map((post) => post.content)).toEqual([
      'Went running by the river this morning',
    ]);
    expect(partial.body.data.map((post) => post.content)).toEqual([
      'Postgres indexes make queries fast',
    ]);
  });

  it('paginates matches newest first', async () => {
    const author = await createSignedInClient();
    for (let index = 0; index < 5; index += 1) await createPost(author, `ripple update ${index}`);
    await createPost(author, 'off topic');

    const posts = await collectAllPages(author, '/search/posts?q=ripple', 2);

    expect(posts.map((post) => post.content)).toEqual([
      'ripple update 4',
      'ripple update 3',
      'ripple update 2',
      'ripple update 1',
      'ripple update 0',
    ]);
  });
});
