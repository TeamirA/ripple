import { Router } from 'express';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { uploadSingleImage } from '../../middlewares/uploadImage.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { usernameParamsSchema } from '../users/users.schemas.js';
import * as postsController from './posts.controller.js';
import { createPostSchema, postIdParamsSchema, updatePostSchema } from './posts.schemas.js';

export const postsRouter = Router();

postsRouter.post(
  '/',
  requireAuth,
  writeRateLimiter,
  uploadSingleImage('image', { maxSizeMb: 4 }),
  validateRequest({ body: createPostSchema }),
  postsController.createPost,
);
postsRouter.get(
  '/:postId',
  validateRequest({ params: postIdParamsSchema }),
  postsController.getPost,
);
postsRouter.patch(
  '/:postId',
  requireAuth,
  writeRateLimiter,
  validateRequest({ params: postIdParamsSchema, body: updatePostSchema }),
  postsController.updatePost,
);
postsRouter.delete(
  '/:postId',
  requireAuth,
  validateRequest({ params: postIdParamsSchema }),
  postsController.deletePost,
);

/** Mounted at /users/:username/posts. */
export const userPostsRouter = Router({ mergeParams: true });

userPostsRouter.get(
  '/',
  validateRequest({ params: usernameParamsSchema, query: paginationQuerySchema }),
  postsController.listUserPosts,
);
