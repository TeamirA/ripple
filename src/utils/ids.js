import { z } from 'zod';

export const idSchema = z.cuid('Invalid id');
