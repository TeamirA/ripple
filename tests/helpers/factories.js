export async function createPost(client, content = 'Hello, Ripple!') {
  const res = await client.post('/posts').send({ content });
  if (res.status !== 201) throw new Error(`Failed to create post: ${res.text}`);
  return res.body.post;
}

export async function createComment(client, postId, content = 'Nice post', parentId) {
  const res = await client.post(`/posts/${postId}/comments`).send({ content, parentId });
  if (res.status !== 201) throw new Error(`Failed to create comment: ${res.text}`);
  return res.body.comment;
}

/** Follows every page of a cursor-paginated endpoint and returns all items. */
export async function collectAllPages(client, path, limit = 2) {
  const items = [];
  let cursor = null;
  do {
    const separator = path.includes('?') ? '&' : '?';
    const query = `limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await client.get(`${path}${separator}${query}`);
    if (res.status !== 200) throw new Error(`Pagination failed: ${res.text}`);
    items.push(...res.body.data);
    cursor = res.body.nextCursor;
  } while (cursor);
  return items;
}
