import { describe, expect, it } from 'vitest';
import {
  buildPage,
  createdAtCursorWhere,
  decodeCursor,
  encodeCursor,
} from '../../src/utils/pagination.js';

describe('cursor encoding', () => {
  it('round-trips cursor values', () => {
    const values = { createdAt: '2026-10-13T10:00:00.000Z', id: 'abc' };

    expect(decodeCursor(encodeCursor(values))).toEqual(values);
  });

  it('rejects garbage cursors with a 400', () => {
    expect(() => decodeCursor('%%%')).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

describe('createdAtCursorWhere', () => {
  it('builds a strict keyset condition for descending order', () => {
    const cursor = encodeCursor({ createdAt: '2026-10-13T10:00:00.000Z', id: 'abc' });
    const createdAt = new Date('2026-10-13T10:00:00.000Z');

    expect(createdAtCursorWhere(cursor)).toEqual({
      OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: 'abc' } }],
    });
  });

  it('returns no condition for the first page', () => {
    expect(createdAtCursorWhere(undefined)).toEqual({});
  });
});

describe('buildPage', () => {
  const rows = [1, 2, 3].map((n) => ({ id: `id${n}`, createdAt: new Date(2026, 9, n) }));

  it('drops the look-ahead row and returns a cursor when more rows exist', () => {
    const page = buildPage(rows, 2);

    expect(page.data).toHaveLength(2);
    expect(decodeCursor(page.nextCursor).id).toBe('id2');
  });

  it('returns a null cursor on the last page', () => {
    expect(buildPage(rows, 3).nextCursor).toBeNull();
  });
});
