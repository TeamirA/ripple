import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { sanitizeSingleLine } from '../../utils/sanitize.js';

const searchTermSchema = z
  .string({ error: 'A search query is required' })
  .transform(sanitizeSingleLine)
  .pipe(z.string().min(1, 'A search query is required').max(100, 'Search query is too long'));

export const searchUsersQuerySchema = z.object({
  q: searchTermSchema,
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const searchPostsQuerySchema = paginationQuerySchema.extend({ q: searchTermSchema });
