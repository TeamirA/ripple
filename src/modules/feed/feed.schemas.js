import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const FeedSort = Object.freeze({ RECENT: 'recent', TRENDING: 'trending' });

export const exploreQuerySchema = paginationQuerySchema.extend({
  sort: z.enum([FeedSort.RECENT, FeedSort.TRENDING]).default(FeedSort.RECENT),
});
