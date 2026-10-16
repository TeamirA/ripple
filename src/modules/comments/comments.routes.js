import { Router } from 'express';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { postIdParamsSchema } from '../posts/posts.schemas.js';
import * as commentsController from './comments.controller.js';
import { commentIdParamsSchema, createCommentSchema } from './comments.schemas.js';

/** Mounted at /posts/:postId/comments. */
export const postCommentsRouter = Router({ mergeParams: true });

postCommentsRouter.get(
  '/',
  validateRequest({ params: postIdParamsSchema, query: paginationQuerySchema }),
  commentsController.listComments,
);
postCommentsRouter.post(
  '/',
  requireAuth,
  writeRateLimiter,
  validateRequest({ params: postIdParamsSchema, body: createCommentSchema }),
  commentsController.addComment,
);

export const commentsRouter = Router();

commentsRouter.get(
  '/:commentId/replies',
  validateRequest({ params: commentIdParamsSchema, query: paginationQuerySchema }),
  commentsController.listReplies,
);
commentsRouter.delete(
  '/:commentId',
  requireAuth,
  validateRequest({ params: commentIdParamsSchema }),
  commentsController.deleteComment,
);
