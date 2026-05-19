"use client";

import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { ReferenceImagePayload } from '@/types';
import {
  ACCEPTED_REFERENCE_IMAGE_TYPES,
  MAX_REFERENCE_IMAGE_BYTES,
  isAcceptedReferenceImageMime,
} from '@/lib/referenceImage';

interface ReferenceImageInputProps {
  value: ReferenceImagePayload | null;
  onChange: (value: ReferenceImagePayload | null) => void;
  disabled?: boolean;
}

export function ReferenceImageInput({ value, onChange, disabled = false }: ReferenceImageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;

    const mimeType = file.type;
    if (!isAcceptedReferenceImageMime(mimeType)) {
      setError('Format gambar harus PNG, JPG, atau WEBP.');
      return;
    }

    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      setError('Ukuran gambar maksimal 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('Gagal membaca gambar.');
        return;
      }
      onChange({ dataUrl: reader.result, mimeType, name: file.name });
    };
    reader.onerror = () => setError('Gagal membaca gambar.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="reference-image" className="font-display font-semibold text-kawaii-text text-sm">
          Gambar referensi karakter
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-kawaii-sm border border-kawaii-border px-2 py-1 text-xs font-semibold text-kawaii-muted hover:bg-primary-50 disabled:opacity-50"
            aria-label="Hapus gambar referensi"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus
          </button>
        ) : null}
      </div>

      <div className={clsx('rounded-kawaii-sm border-2 border-dashed p-3', value ? 'border-secondary-200 bg-secondary-50' : 'border-kawaii-border bg-white')}>
        <input
          ref={inputRef}
          id="reference-image"
          type="file"
          accept={ACCEPTED_REFERENCE_IMAGE_TYPES.join(',')}
          disabled={disabled}
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="sr-only"
          aria-label="Upload gambar referensi"
        />

        {value ? (
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-kawaii-sm border border-kawaii-border bg-white">
              <Image src={value.dataUrl} alt="Preview gambar referensi" fill sizes="80px" className="object-contain" unoptimized />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-kawaii-text">Referensi aktif</p>
              <p className="truncate text-xs text-kawaii-muted">{value.name ?? 'Gambar karakter'}</p>
              <p className="text-xs text-kawaii-muted">Bentuk karakter akan diambil dari gambar.</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-kawaii-sm bg-primary-50 px-3 py-4 text-sm font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Upload gambar karakter
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs font-body text-secondary-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
