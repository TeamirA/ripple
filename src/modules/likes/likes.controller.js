import * as likesService from './likes.service.js';

export async function likePost(req, res) {
  res.json(await likesService.likePost(req.user.id, req.params.postId));
}

export async function unlikePost(req, res) {
  res.json(await likesService.unlikePost(req.user.id, req.params.postId));
}

export async function likeComment(req, res) {
  res.json(await likesService.likeComment(req.user.id, req.params.commentId));
}

export async function unlikeComment(req, res) {
  res.json(await likesService.unlikeComment(req.user.id, req.params.commentId));
}
