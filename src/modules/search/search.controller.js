import * as searchService from './search.service.js';

export async function searchUsers(req, res) {
  res.json(await searchService.searchUsers(req.query, req.user?.id));
}

export async function searchPosts(req, res) {
  res.json(await searchService.searchPosts(req.query, req.user?.id));
}
