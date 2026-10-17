import { z } from 'zod';
import { sanitizeSingleLine } from '../../utils/sanitize.js';

// bcrypt only uses the first 72 bytes of a password.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

// Usernames that would collide with routes such as /users/me or /users/suggestions.
const RESERVED_USERNAMES = new Set(['me', 'suggestions', 'admin', 'api', 'settings', 'explore']);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9_.]+$/, 'Username may only contain letters, numbers, underscores and dots')
  .refine((value) => !/^\.|\.$|\.\./.test(value), 'Username cannot start, end or repeat dots')
  .refine((value) => !RESERVED_USERNAMES.has(value), 'This username is reserved');

export const displayNameSchema = z
  .string()
  .transform(sanitizeSingleLine)
  .pipe(z.string().min(1, 'Display name is required').max(50, 'Display name is too long'));

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address').max(255)),
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, 'Email or username is required').max(255),
  password: z.string().min(1, 'Password is required').max(72),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });
