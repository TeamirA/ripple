import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitize.js';
import { displayNameSchema, usernameSchema } from '../auth/auth.schemas.js';

export const usernameParamsSchema = z.object({ username: usernameSchema });

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: z
      .string()
      .transform(sanitizeText)
      .pipe(z.string().max(160, 'Bio must be at most 160 characters'))
      .optional(),
    bannerColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Banner color must be a hex color like #6366f1')
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });
