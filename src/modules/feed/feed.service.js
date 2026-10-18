import { buildPage } from '../../utils/pagination.js';
import { toPostResponse } from '../posts/posts.selects.js';
import * as feedRepository from './feed.repository.js';
import { FeedSort } from './feed.schemas.js';

export const TRENDING_WINDOW_HOURS = 48;

function toPostPage(rows, limit, getCursorValues) {
  const page = buildPage(rows, limit, getCursorValues);
  return { ...page, data: page.data.map(toPostResponse) };
}

/**
 * Home timeline: the viewer's own posts plus posts from people they follow.
 * @param {string} viewerId
 * @param {{ cursor?: string, limit: number }} pagination
 */
export async function getFollowingFeed(viewerId, pagination) {
  const rows = await feedRepository.findFollowingFeed(viewerId, pagination);
  return toPostPage(rows, pagination.limit);
}

/**
 * Public feed: everything newest first, or the most-liked posts of the last 48 hours.
 * @param {{ sort: 'recent' | 'trending', cursor?: string, limit: number }} query
 * @param {string | undefined} viewerId
 */
export async function getExploreFeed({ sort, ...pagination }, viewerId) {
  if (sort === FeedSort.TRENDING) {
    const since = new Date(Date.now() - TRENDING_WINDOW_HOURS * 60 * 60 * 1000);
    const rows = await feedRepository.findTrendingPosts(since, pagination, viewerId);
    return toPostPage(rows, pagination.limit, (post) => ({
      likesCount: post.likesCount,
      id: post.id,
    }));
  }
  const rows = await feedRepository.findRecentPosts(pagination, viewerId);
  return toPostPage(rows, pagination.limit);
}
