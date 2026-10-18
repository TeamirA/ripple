import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import * as feedController from './feed.controller.js';
import { exploreQuerySchema } from './feed.schemas.js';

export const feedRouter = Router();

feedRouter.get(
  '/following',
  requireAuth,
  validateRequest({ query: paginationQuerySchema }),
  feedController.getFollowingFeed,
);
feedRouter.get(
  '/explore',
  validateRequest({ query: exploreQuerySchema }),
  feedController.getExploreFeed,
);
