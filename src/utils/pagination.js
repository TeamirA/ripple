import { z } from 'zod';
import { AppError } from './AppError.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const paginationQuerySchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/** Cursors are opaque to clients: base64url-encoded JSON of the last item's sort keys. */
export function encodeCursor(values) {
  return Buffer.from(JSON.stringify(values)).toString('base64url');
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const values = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!values || typeof values !== 'object') throw new Error('Invalid cursor');
    return values;
  } catch {
    throw AppError.badRequest('Invalid pagination cursor');
  }
}

/**
 * Keyset condition for rows ordered by (createdAt, id) in the given direction.
 * Strictly "after" the cursor row, so pages never overlap or skip rows.
 */
export function createdAtCursorWhere(cursor, direction = 'desc') {
  const values = decodeCursor(cursor);
  if (!values) return {};

  const createdAt = new Date(values.createdAt);
  if (Number.isNaN(createdAt.getTime()) || typeof values.id !== 'string') {
    throw AppError.badRequest('Invalid pagination cursor');
  }
  const comparator = direction === 'desc' ? 'lt' : 'gt';
  return {
    OR: [
      { createdAt: { [comparator]: createdAt } },
      { createdAt, id: { [comparator]: values.id } },
    ],
  };
}

export function createdAtOrderBy(direction = 'desc') {
  return [{ createdAt: direction }, { id: direction }];
}

/**
 * Turns `limit + 1` fetched rows into a page. The extra row only signals
 * whether another page exists and is never returned.
 */
export function buildPage(
  rows,
  limit,
  getCursorValues = (row) => ({ createdAt: row.createdAt, id: row.id }),
) {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? encodeCursor(getCursorValues(data[data.length - 1])) : null;
  return { data, nextCursor };
}
