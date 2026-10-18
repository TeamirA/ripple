import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as searchController from './search.controller.js';
import { searchPostsQuerySchema, searchUsersQuerySchema } from './search.schemas.js';

export const searchRouter = Router();

searchRouter.get(
  '/users',
  validateRequest({ query: searchUsersQuerySchema }),
  searchController.searchUsers,
);
searchRouter.get(
  '/posts',
  validateRequest({ query: searchPostsQuerySchema }),
  searchController.searchPosts,
);
