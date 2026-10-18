import * as feedService from './feed.service.js';

export async function getFollowingFeed(req, res) {
  res.json(await feedService.getFollowingFeed(req.user.id, req.query));
}

export async function getExploreFeed(req, res) {
  res.json(await feedService.getExploreFeed(req.query, req.user?.id));
}
