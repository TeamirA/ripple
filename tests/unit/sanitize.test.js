import { describe, expect, it } from 'vitest';
import { sanitizeSingleLine, sanitizeText } from '../../src/utils/sanitize.js';

describe('sanitizeText', () => {
  it('trims, normalizes newlines and collapses blank lines', () => {
    expect(sanitizeText('  hello\r\n\r\n\r\n\r\nworld  ')).toBe('hello\n\nworld');
  });

  it('removes control characters but keeps HTML for render-time escaping', () => {
    expect(sanitizeText('a\u0000b\u0007c <b>bold</b>')).toBe('abc <b>bold</b>');
  });
});

describe('sanitizeSingleLine', () => {
  it('collapses all whitespace to single spaces', () => {
    expect(sanitizeSingleLine(' Maya \n\t Okafor ')).toBe('Maya Okafor');
  });
});
