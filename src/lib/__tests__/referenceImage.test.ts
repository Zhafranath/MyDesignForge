import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_REFERENCE_IMAGE_TYPES,
  MAX_REFERENCE_IMAGE_BYTES,
  getReferenceImageDataUrlInfo,
  isAcceptedReferenceImageMime,
} from '../referenceImage';

describe('referenceImage helpers', () => {
  it('accepts png jpeg and webp only', () => {
    expect(ACCEPTED_REFERENCE_IMAGE_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp']);
    expect(isAcceptedReferenceImageMime('image/png')).toBe(true);
    expect(isAcceptedReferenceImageMime('image/jpeg')).toBe(true);
    expect(isAcceptedReferenceImageMime('image/webp')).toBe(true);
    expect(isAcceptedReferenceImageMime('image/gif')).toBe(false);
  });

  it('extracts mime type and decoded byte size from a data url', () => {
    const info = getReferenceImageDataUrlInfo('data:image/png;base64,aGVsbG8=');

    expect(info).toEqual({ mimeType: 'image/png', byteSize: 5 });
  });

  it('rejects non-data-url values', () => {
    expect(getReferenceImageDataUrlInfo('https://example.com/image.png')).toBeNull();
  });

  it('documents the max image size as four megabytes', () => {
    expect(MAX_REFERENCE_IMAGE_BYTES).toBe(4 * 1024 * 1024);
  });
});
