import { buildPage } from '../../utils/pagination.js';
import { attachFollowState } from '../follows/follows.service.js';
import { toPostResponse } from '../posts/posts.selects.js';
import * as searchRepository from './search.repository.js';

/** Restores the ranking of `ids` after an unordered `WHERE id IN (...)` lookup. */
function orderByIds(rows, ids) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => rowsById.get(id)).filter(Boolean);
}

/**
 * Best user matches for `q`, with the viewer's follow state.
 * @param {{ q: string, limit: number }} query
 */
export async function searchUsers({ q, limit }, viewerId) {
  const ids = await searchRepository.searchUserIds(q, limit);
  const users = orderByIds(await searchRepository.findUserCardsByIds(ids), ids);
  return { data: await attachFollowState(users, viewerId), nextCursor: null };
}

/**
 * Posts matching `q`, newest first, cursor-paginated.
 * @param {{ q: string, cursor?: string, limit: number }} query
 */
export async function searchPosts({ q, ...pagination }, viewerId) {
  const keys = await searchRepository.searchPostKeys(q, pagination);
  const page = buildPage(keys, pagination.limit);
  const ids = page.data.map((key) => key.id);
  const posts = orderByIds(await searchRepository.findPostsByIds(ids, viewerId), ids);
  return { data: posts.map(toPostResponse), nextCursor: page.nextCursor };
}
