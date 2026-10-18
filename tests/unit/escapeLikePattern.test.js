import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from '../../src/utils/escapeLikePattern.js';

describe('escapeLikePattern', () => {
  it('escapes %, _ and backslashes', () => {
    expect(escapeLikePattern('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
