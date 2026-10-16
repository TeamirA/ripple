import * as postsService from './posts.service.js';

export async function createPost(req, res) {
  const post = await postsService.createPost(req.user.id, req.body, req.file);
  res.status(201).json({ post });
}

export async function getPost(req, res) {
  const post = await postsService.getPost(req.params.postId, req.user?.id);
  res.json({ post });
}

export async function updatePost(req, res) {
  const post = await postsService.updatePost(req.params.postId, req.user.id, req.body);
  res.json({ post });
}

export async function deletePost(req, res) {
  await postsService.deletePost(req.params.postId, req.user.id);
  res.status(204).end();
}

export async function listUserPosts(req, res) {
  const page = await postsService.listPostsByUsername(req.params.username, req.query, req.user?.id);
  res.json(page);
}
