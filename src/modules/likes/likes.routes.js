import { Router } from 'express';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { commentIdParamsSchema } from '../comments/comments.schemas.js';
import { postIdParamsSchema } from '../posts/posts.schemas.js';
import * as likesController from './likes.controller.js';

const validatePostId = validateRequest({ params: postIdParamsSchema });
const validateCommentId = validateRequest({ params: commentIdParamsSchema });

/** Mounted at /posts/:postId/like. */
export const postLikeRouter = Router({ mergeParams: true });

postLikeRouter.use(requireAuth);
postLikeRouter.put('/', writeRateLimiter, validatePostId, likesController.likePost);
postLikeRouter.delete('/', validatePostId, likesController.unlikePost);

/** Mounted at /comments/:commentId/like. */
export const commentLikeRouter = Router({ mergeParams: true });

commentLikeRouter.use(requireAuth);
commentLikeRouter.put('/', writeRateLimiter, validateCommentId, likesController.likeComment);
commentLikeRouter.delete('/', validateCommentId, likesController.unlikeComment);
