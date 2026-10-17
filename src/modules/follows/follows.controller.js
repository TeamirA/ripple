import * as followsService from './follows.service.js';

export async function followUser(req, res) {
  res.json(await followsService.followUser(req.user.id, req.params.username));
}

export async function unfollowUser(req, res) {
  res.json(await followsService.unfollowUser(req.user.id, req.params.username));
}

export async function listFollowers(req, res) {
  res.json(await followsService.listFollowers(req.params.username, req.query, req.user?.id));
}

export async function listFollowing(req, res) {
  res.json(await followsService.listFollowing(req.params.username, req.query, req.user?.id));
}

export async function getSuggestions(req, res) {
  const users = await followsService.getSuggestions(req.user?.id, req.query.limit);
  res.json({ data: users });
}
