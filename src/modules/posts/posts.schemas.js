import { z } from 'zod';
import { idSchema } from '../../utils/ids.js';
import { sanitizeText } from '../../utils/sanitize.js';

export const POST_MAX_LENGTH = 500;

export const postContentSchema = z
  .string({ error: 'Post content is required' })
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Post cannot be empty')
      .max(POST_MAX_LENGTH, `Post must be at most ${POST_MAX_LENGTH} characters`),
  );

export const postIdParamsSchema = z.object({ postId: idSchema });

export const createPostSchema = z.object({ content: postContentSchema });

export const updatePostSchema = z.object({ content: postContentSchema }).strict();
