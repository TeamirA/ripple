import * as commentsService from './comments.service.js';

export async function listComments(req, res) {
  const page = await commentsService.listComments(req.params.postId, req.query, req.user?.id);
  res.json(page);
}

export async function addComment(req, res) {
  const comment = await commentsService.addComment(req.params.postId, req.user.id, req.body);
  res.status(201).json({ comment });
}

export async function listReplies(req, res) {
  const page = await commentsService.listReplies(req.params.commentId, req.query, req.user?.id);
  res.json(page);
}

export async function deleteComment(req, res) {
  await commentsService.deleteComment(req.params.commentId, req.user.id);
  res.status(204).end();
}
