import { describe, expect, it } from 'vitest';
import { detectImageType } from '../../src/utils/imageType.js';
import { NOT_AN_IMAGE, TINY_PNG } from '../helpers/fixtures.js';

describe('detectImageType', () => {
  it('recognizes images by their magic bytes', () => {
    expect(detectImageType(TINY_PNG)).toBe('image/png');
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'binary'))).toBe('image/webp');
  });

  it('returns null for anything else', () => {
    expect(detectImageType(NOT_AN_IMAGE)).toBeNull();
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WAVE', 'binary'))).toBeNull();
  });
});
