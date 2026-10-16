import { z } from 'zod';
import { idSchema } from '../../utils/ids.js';
import { sanitizeText } from '../../utils/sanitize.js';

export const COMMENT_MAX_LENGTH = 500;

export const commentIdParamsSchema = z.object({ commentId: idSchema });

export const createCommentSchema = z.object({
  content: z
    .string({ error: 'Comment content is required' })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, 'Comment cannot be empty')
        .max(COMMENT_MAX_LENGTH, `Comment must be at most ${COMMENT_MAX_LENGTH} characters`),
    ),
  parentId: idSchema.optional(),
});
