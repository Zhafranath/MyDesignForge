import type { ReferenceImagePayload } from '@/types';

export const ACCEPTED_REFERENCE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024;

export type ReferenceImageMimeType = (typeof ACCEPTED_REFERENCE_IMAGE_TYPES)[number];

export function isAcceptedReferenceImageMime(value: string): value is ReferenceImageMimeType {
  return (ACCEPTED_REFERENCE_IMAGE_TYPES as readonly string[]).includes(value);
}

export function getReferenceImageDataUrlInfo(dataUrl: string): { mimeType: string; byteSize: number } | null {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64] = match;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const byteSize = Math.floor((base64.length * 3) / 4) - padding;
  return { mimeType, byteSize };
}

export function validateReferenceImagePayload(
  value: unknown
): { valid: true; image?: ReferenceImagePayload } | { valid: false; error: string } {
  if (value === undefined || value === null) {
    return { valid: true };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, error: 'Gambar referensi tidak valid.' };
  }

  const image = value as Record<string, unknown>;
  if (typeof image.dataUrl !== 'string' || typeof image.mimeType !== 'string') {
    return { valid: false, error: 'Gambar referensi tidak valid.' };
  }

  const info = getReferenceImageDataUrlInfo(image.dataUrl);
  if (!info) {
    return { valid: false, error: 'Gambar referensi harus berupa data URL base64.' };
  }

  if (!isAcceptedReferenceImageMime(image.mimeType) || info.mimeType !== image.mimeType) {
    return { valid: false, error: 'Format gambar referensi harus PNG, JPG, atau WEBP.' };
  }

  if (info.byteSize > MAX_REFERENCE_IMAGE_BYTES) {
    return { valid: false, error: 'Ukuran gambar referensi maksimal 4 MB.' };
  }

  return {
    valid: true,
    image: {
      dataUrl: image.dataUrl,
      mimeType: image.mimeType,
      name: typeof image.name === 'string' ? image.name.slice(0, 120) : undefined,
    },
  };
}
