# Reference Image Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional reference image upload so the app analyzes an uploaded character image with a vision model and uses that analysis as the locked character identity for generated prompt packs.

**Architecture:** Keep image data transient: the browser reads an image as a data URL, `/api/generate` validates it, Groq vision converts it to text, and the existing text generation path consumes that reference description. Prompt builders get a reference-context option so normal manual character-form generation remains unchanged when no image is uploaded.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Groq chat completions with vision `image_url` content, Vitest, Testing Library.

---

## File Map

- Modify `src/types/index.ts`: add `ReferenceImagePayload` and reference context fields to generation types.
- Create `src/lib/referenceImage.ts`: browser/server-safe validation helpers, accepted MIME constants, max size, and data URL size parsing.
- Modify `src/lib/prompts.ts`: add reference-image lock section to system and regenerate prompts.
- Modify `src/app/api/generate/route.ts`: validate `referenceImage`, analyze it with Groq vision, and pass analysis to prompt builders.
- Modify `src/hooks/useGenerate.ts`: allow `generate()` to send `referenceImage`.
- Create `src/components/ReferenceImageInput.tsx`: upload, preview, remove, and validation UI.
- Modify `src/app/page.tsx`: hold reference image state, render upload component, disable/manual form section when active, and pass image to generation.
- Add/update tests in `src/lib/__tests__/prompts.test.ts`, `src/app/api/generate/route.test.ts`, `src/components/__tests__/ReferenceImageInput.test.tsx`, and existing component tests if needed.
- Update `.env.example` and `README.md`: document `GROQ_VISION_MODEL` and reference image limits.

---

### Task 1: Reference Image Types and Validation Helpers

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/referenceImage.ts`
- Test: `src/lib/__tests__/referenceImage.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `src/lib/__tests__/referenceImage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run helper tests and verify failure**

Run: `npm run test -- src/lib/__tests__/referenceImage.test.ts`

Expected: FAIL because `src/lib/referenceImage.ts` does not exist.

- [ ] **Step 3: Add types**

Modify `src/types/index.ts`:

```ts
export interface ReferenceImagePayload {
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  name?: string;
}

export interface ReferenceImageContext {
  description: string;
}
```

Extend `GenerationOptions`:

```ts
export interface GenerationOptions {
  characterForm: CharacterForm;
  textMode: TextMode;
  theme: DesignTheme;
  customText?: string;
  referenceImageContext?: ReferenceImageContext;
}
```

- [ ] **Step 4: Add helper implementation**

Create `src/lib/referenceImage.ts`:

```ts
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

export function validateReferenceImagePayload(value: unknown): { valid: true; image?: ReferenceImagePayload } | { valid: false; error: string } {
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
```

- [ ] **Step 5: Run helper tests and verify pass**

Run: `npm run test -- src/lib/__tests__/referenceImage.test.ts`

Expected: PASS.

---

### Task 2: Prompt Builder Reference Lock

**Files:**
- Modify: `src/lib/prompts.ts`
- Test: `src/lib/__tests__/prompts.test.ts`

- [ ] **Step 1: Write failing prompt tests**

Append to `src/lib/__tests__/prompts.test.ts`:

```ts
it('locks generated sticker prompts to the uploaded reference image character', () => {
  const prompt = buildSystemPrompt('stable-diffusion', 'sticker', {
    characterForm: 'animal',
    textMode: 'none',
    theme: 'simple-cute',
    referenceImageContext: {
      description: 'A round blue cat mascot with tiny yellow scarf, sleepy eyes, and star cheek marks.',
    },
  });

  expect(prompt).toContain('REFERENCE IMAGE CHARACTER LOCK');
  expect(prompt).toContain('The uploaded reference image is the locked character source.');
  expect(prompt).toContain('round blue cat mascot');
  expect(prompt).toContain('Do not change the character form');
  expect(prompt).not.toContain('Selected character form: animal');
});

it('keeps reference image identity locked during regenerate prompts', () => {
  const prompt = buildRegeneratePrompt(
    {
      name: 'Blue Star Cat',
      description: 'Reference image character: A round blue cat mascot with tiny yellow scarf.',
      colors: ['#3b82f6', '#facc15'],
      style: 'clean vector sticker',
      characterType: 'cat mascot',
    },
    'happy',
    'dalle',
    'sticker',
    {
      characterForm: 'auto',
      textMode: 'none',
      theme: 'simple-cute',
      referenceImageContext: {
        description: 'A round blue cat mascot with tiny yellow scarf, sleepy eyes, and star cheek marks.',
      },
    }
  );

  expect(prompt).toContain('REFERENCE IMAGE CHARACTER LOCK');
  expect(prompt).toContain('tiny yellow scarf');
  expect(prompt).toContain('Do not change the character form');
});
```

- [ ] **Step 2: Run prompt tests and verify failure**

Run: `npm run test -- src/lib/__tests__/prompts.test.ts`

Expected: FAIL because prompt builder has no reference lock section yet.

- [ ] **Step 3: Implement reference lock helpers**

In `src/lib/prompts.ts`, add:

```ts
function buildCharacterIdentityGuide(options: GenerationOptions): string {
  const referenceDescription = options.referenceImageContext?.description.trim();
  if (referenceDescription) {
    return `## REFERENCE IMAGE CHARACTER LOCK
The uploaded reference image is the locked character source.
Reference image character description:
${referenceDescription}

- Do not change the character form, species/object type, core silhouette, palette, signature accessories, markings, or personality cues from the reference image.
- The concept characterType must be inferred from the reference image description.
- Every design prompt must explicitly preserve the reference character identity while changing only expression, pose, role, or small scene details.
- Use the reference as inspiration for an original, seller-safe design. If the reference resembles a copyrighted character, transform it into a safer original archetype without copying protected names, logos, or exact costume details.`;
  }

  return `## CHARACTER FORM OPTION
${buildCharacterFormGuide(options.characterForm)}`;
}
```

Replace the `## CHARACTER FORM OPTION` block in both `buildSystemPrompt` and `buildRegeneratePrompt` with:

```ts
const characterIdentityGuide = buildCharacterIdentityGuide(options);
```

and interpolate:

```ts
${characterIdentityGuide}
```

Remove the old separate `## CHARACTER FORM OPTION` wrapper from those prompt templates.

- [ ] **Step 4: Run prompt tests and verify pass**

Run: `npm run test -- src/lib/__tests__/prompts.test.ts`

Expected: PASS.

---

### Task 3: API Reference Image Validation and Vision Analysis

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Test: `src/app/api/generate/route.test.ts`

- [ ] **Step 1: Write failing API tests**

Modify the Groq mock in `src/app/api/generate/route.test.ts` to capture create calls:

```ts
const createMock = vi.fn(async function* (request: unknown) {
  groqCreateCalls.push(request);
  yield { choices: [{ delta: { content: groqOutput } }] };
});
const groqCreateCalls: unknown[] = [];
```

Add tests:

```ts
it('rejects unsupported reference image MIME types', async () => {
  const response = await postGenerate({
    description: 'buat sticker dari gambar',
    platform: 'midjourney',
    targetProduct: 'sticker',
    characterForm: 'animal',
    textMode: 'none',
    theme: 'auto',
    referenceImage: {
      dataUrl: 'data:image/gif;base64,aGVsbG8=',
      mimeType: 'image/gif',
      name: 'bad.gif',
    },
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    message: 'Format gambar referensi harus PNG, JPG, atau WEBP.',
  });
});

it('uses Groq vision before generation when reference image is supplied', async () => {
  const response = await postGenerate({
    description: 'buat sticker lucu',
    platform: 'midjourney',
    targetProduct: 'sticker',
    characterForm: 'animal',
    textMode: 'none',
    theme: 'auto',
    referenceImage: {
      dataUrl: 'data:image/png;base64,aGVsbG8=',
      mimeType: 'image/png',
      name: 'cat.png',
    },
  });

  expect(response.status).toBe(200);
  expect(groqCreateCalls).toHaveLength(2);
  expect(JSON.stringify(groqCreateCalls[0])).toContain('image_url');
  expect(JSON.stringify(groqCreateCalls[1])).toContain('REFERENCE IMAGE CHARACTER LOCK');
});
```

Set mock output for the first call to return a plain vision description and second call to return `groqOutput`.

- [ ] **Step 2: Run API tests and verify failure**

Run: `npm run test -- src/app/api/generate/route.test.ts`

Expected: FAIL because `referenceImage` is ignored.

- [ ] **Step 3: Implement API validation and vision call**

In `src/app/api/generate/route.ts`:

- import `ReferenceImagePayload` type and `validateReferenceImagePayload`;
- add `referenceImage?: ReferenceImagePayload` to `GenerateBody`;
- call `validateReferenceImagePayload(b.referenceImage)` inside `validateBody`;
- relax description validation only when a valid image exists:

```ts
const referenceValidation = validateReferenceImagePayload(b.referenceImage);
if (!referenceValidation.valid) return { valid: false, error: referenceValidation.error };
const hasReferenceImage = !!referenceValidation.image;
const rawDescription = typeof b.description === 'string' ? b.description.trim() : '';
if (!hasReferenceImage && rawDescription.length < 5) {
  return { valid: false, error: 'Deskripsi karakter minimal 5 karakter.' };
}
if (rawDescription.length > 700) {
  return { valid: false, error: 'Deskripsi karakter maksimal 700 karakter.' };
}
```

Add helper:

```ts
async function analyzeReferenceImage(
  groq: Groq,
  referenceImage: ReferenceImagePayload,
  userDirection: string
): Promise<string> {
  const model = process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct';
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this uploaded character reference for a print-on-demand prompt generator. Describe only visible character details: form/species/object type, body shape, face, expression, colors, clothing, accessories, markings, pose, silhouette, style, details to preserve, and details to simplify for clean sticker artwork. User direction: ${userDirection || 'Create a sticker-ready character prompt pack from this reference image.'}`,
          },
          {
            type: 'image_url',
            image_url: { url: referenceImage.dataUrl },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  const description = completion.choices[0]?.message?.content?.trim();
  if (!description) {
    throw new Error('Gambar referensi gagal dianalisis.');
  }
  return description;
}
```

Before building `generationOptions`:

```ts
let referenceImageContext: GenerationOptions['referenceImageContext'];
if (validation.data.referenceImage) {
  try {
    const referenceDescription = await analyzeReferenceImage(groq, validation.data.referenceImage, description);
    referenceImageContext = { description: referenceDescription };
  } catch {
    return NextResponse.json(
      { type: 'error', message: 'Gambar referensi gagal dianalisis. Coba gambar yang lebih jelas.' },
      { status: 502 }
    );
  }
}
```

Build options:

```ts
const generationOptions: GenerationOptions = {
  characterForm: referenceImageContext ? 'auto' : characterForm,
  textMode,
  theme,
  customText,
  referenceImageContext,
};
```

- [ ] **Step 4: Run API tests and verify pass**

Run: `npm run test -- src/app/api/generate/route.test.ts`

Expected: PASS.

---

### Task 4: Upload Component

**Files:**
- Create: `src/components/ReferenceImageInput.tsx`
- Test: `src/components/__tests__/ReferenceImageInput.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `src/components/__tests__/ReferenceImageInput.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferenceImageInput } from '../ReferenceImageInput';

describe('ReferenceImageInput', () => {
  it('accepts a valid image and shows preview state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(['hello'], 'cat.png', { type: 'image/png' });

    render(<ReferenceImageInput value={null} onChange={onChange} disabled={false} />);

    await user.upload(screen.getByLabelText(/upload gambar referensi/i), file);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'cat.png',
        mimeType: 'image/png',
        dataUrl: expect.stringContaining('data:image/png;base64,'),
      })
    );
  });

  it('removes the selected reference image', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ReferenceImageInput
        value={{ name: 'cat.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,aGVsbG8=' }}
        onChange={onChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /hapus gambar referensi/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('rejects unsupported files', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(['hello'], 'cat.gif', { type: 'image/gif' });

    render(<ReferenceImageInput value={null} onChange={onChange} disabled={false} />);

    await user.upload(screen.getByLabelText(/upload gambar referensi/i), file);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Format gambar harus PNG, JPG, atau WEBP.');
  });
});
```

- [ ] **Step 2: Run component test and verify failure**

Run: `npm run test -- src/components/__tests__/ReferenceImageInput.test.tsx`

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement component**

Create `src/components/ReferenceImageInput.tsx`:

```tsx
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

    if (!isAcceptedReferenceImageMime(file.type)) {
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
      onChange({ dataUrl: reader.result, mimeType: file.type, name: file.name });
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
```

- [ ] **Step 4: Run component test and verify pass**

Run: `npm run test -- src/components/__tests__/ReferenceImageInput.test.tsx`

Expected: PASS.

---

### Task 5: Wire Upload State Into Page and Hook

**Files:**
- Modify: `src/hooks/useGenerate.ts`
- Modify: `src/app/page.tsx`
- Test: `src/components/__tests__/GenerationOptionsSelectors.test.tsx` or add focused page-adjacent tests only if existing setup allows.

- [ ] **Step 1: Update hook signature**

In `src/hooks/useGenerate.ts`, import `ReferenceImagePayload` and update `generate`:

```ts
generate: (
  description: string,
  platform: Platform,
  targetProduct: ProductType,
  generationOptions: GenerationOptions,
  referenceImage?: ReferenceImagePayload | null
) => Promise<void>;
```

Implementation:

```ts
await streamFromApi({
  description: desc,
  platform,
  targetProduct,
  ...generationOptions,
  referenceImage: referenceImage ?? undefined,
});
```

- [ ] **Step 2: Wire page state**

In `src/app/page.tsx`:

```ts
import { ReferenceImageInput } from '@/components/ReferenceImageInput';
import type { ReferenceImagePayload } from '@/types';
```

Add state:

```ts
const [referenceImage, setReferenceImage] = useState<ReferenceImagePayload | null>(null);
```

Allow generation with either description or image:

```ts
if ((!description.trim() && !referenceImage) || state.status === 'generating') return;
```

Call:

```ts
await generate(description, platform, targetProduct, generationOptions, referenceImage);
```

Render after `CharacterInput`:

```tsx
<div className="border-t border-kawaii-border pt-5">
  <ReferenceImageInput
    value={referenceImage}
    onChange={setReferenceImage}
    disabled={isGenerating}
  />
</div>
```

Change character form section:

```tsx
<div className="border-t border-kawaii-border pt-5">
  {referenceImage ? (
    <div className="rounded-kawaii-sm border border-secondary-200 bg-secondary-50 p-3">
      <p className="font-display text-sm font-semibold text-kawaii-text">
        Bentuk karakter dari gambar referensi
      </p>
      <p className="mt-1 text-xs text-kawaii-muted">
        Selector bentuk karakter dinonaktifkan karena karakter akan dianalisis dari gambar upload.
      </p>
    </div>
  ) : (
    <CharacterFormSelector
      value={generationOptions.characterForm}
      onChange={handleCharacterFormChange}
      disabled={isGenerating}
    />
  )}
</div>
```

- [ ] **Step 3: Run UI and hook tests**

Run: `npm run test -- src/components/__tests__/ReferenceImageInput.test.tsx src/components/__tests__/GenerationOptionsSelectors.test.tsx src/components/__tests__/CharacterInput.test.tsx`

Expected: PASS.

---

### Task 6: Documentation and Environment

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update `.env.example`**

Add:

```env
# Vision model used to analyze uploaded character reference images.
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

- [ ] **Step 2: Update README**

Add a section:

```md
## Reference Image Upload

Users can upload a PNG, JPG, or WEBP character image up to 4 MB. The app sends the image to a Groq vision model, converts it into a detailed character description, and locks generated prompts to that character identity. When a reference image is active, the manual Character Form selector is disabled because the form is inferred from the image.

Configure the vision model:

```env
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Reference images are not stored permanently. They are sent as request data for analysis only.
```

- [ ] **Step 3: Review docs**

Run: `rg -n "GROQ_VISION_MODEL|Reference Image Upload|4 MB" README.md .env.example`

Expected: all new documentation is present.

---

### Task 7: Full Verification and Commit

**Files:**
- All changed files

- [ ] **Step 1: Run full tests**

Run: `npm run test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`

Expected: exit 0.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: production build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add .env.example README.md src/types/index.ts src/lib/referenceImage.ts src/lib/__tests__/referenceImage.test.ts src/lib/prompts.ts src/lib/__tests__/prompts.test.ts src/app/api/generate/route.ts src/app/api/generate/route.test.ts src/hooks/useGenerate.ts src/components/ReferenceImageInput.tsx src/components/__tests__/ReferenceImageInput.test.tsx src/app/page.tsx docs/superpowers/plans/2026-05-19-reference-image-character.md
git commit -m "Add reference image character generation"
```

Expected: commit created with only project files, not `image_service/__pycache__`.

