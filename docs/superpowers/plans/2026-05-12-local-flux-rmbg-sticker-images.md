# Local FLUX.1 + rembg Sticker Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sticker-only image generation controls that proxy each prompt to a local FLUX.1 + rembg HTTP service and let users download the resulting image.

**Architecture:** Keep FLUX.1 and rembg outside the Next.js app. Add `/api/sticker-image` as a thin validated proxy to `STICKER_IMAGE_API_URL`, then add transient per-card image generation state in `StickerCard`. `StickerGrid` passes `targetProduct` so only sticker cards render image controls.

**Tech Stack:** Next.js App Router route handlers, React client components, Vitest, Testing Library, existing Tailwind/lucide UI patterns.

---

## File Structure

- Create `src/app/api/sticker-image/route.ts`: validates prompt/expression, calls the configured local image service, normalizes errors.
- Create `src/app/api/sticker-image/route.test.ts`: covers request validation, missing env, upstream success, upstream failure, and timeout/network errors.
- Create `src/components/__tests__/StickerCard.test.tsx`: covers sticker-only image controls, product gating, edited prompt submission, and successful preview/download UI.
- Modify `src/components/StickerCard.tsx`: add sticker image generation state, UI, and download behavior.
- Modify `src/components/StickerGrid.tsx`: pass `targetProduct` into each card.
- Modify `.env.example`: document `STICKER_IMAGE_API_URL` and `STICKER_IMAGE_API_TIMEOUT_MS`.

---

### Task 1: Sticker Image API Proxy

**Files:**
- Create: `src/app/api/sticker-image/route.test.ts`
- Create: `src/app/api/sticker-image/route.ts`

- [ ] **Step 1: Write failing route tests**

Add `src/app/api/sticker-image/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/sticker-image', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.STICKER_IMAGE_API_URL = 'http://localhost:8000/generate-sticker';
    process.env.STICKER_IMAGE_API_TIMEOUT_MS = '120000';
  });

  async function postStickerImage(body: Record<string, unknown>) {
    const { POST } = await import('./route');
    return POST(
      new Request('http://localhost/api/sticker-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }) as never
    );
  }

  it('rejects a short prompt', async () => {
    const response = await postStickerImage({ prompt: 'cat', expression: 'happy' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Prompt gambar minimal 5 karakter.',
    });
  });

  it('rejects an invalid expression', async () => {
    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'surprised',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Expression tidak valid.',
    });
  });

  it('fails clearly when the local image service URL is missing', async () => {
    delete process.env.STICKER_IMAGE_API_URL;

    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'happy',
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: 'STICKER_IMAGE_API_URL belum dikonfigurasi.',
    });
  });

  it('proxies a successful imageUrl response from the local service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ imageUrl: 'data:image/png;base64,abc123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'happy',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      imageUrl: 'data:image/png;base64,abc123',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/generate-sticker',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'cute blue cat sticker',
          expression: 'happy',
        }),
      })
    );
  });

  it('returns a clean error when the local service fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'GPU busy' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'happy',
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Local image service gagal: GPU busy',
    });
  });

  it('returns 504 when the local service cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'happy',
    });

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Local image service tidak merespons. Pastikan FLUX.1 + rembg sedang berjalan.',
    });
  });
});
```

- [ ] **Step 2: Run route tests and verify RED**

Run: `npm run test -- src/app/api/sticker-image/route.test.ts`

Expected: FAIL because `src/app/api/sticker-image/route.ts` does not exist.

- [ ] **Step 3: Implement the route**

Create `src/app/api/sticker-image/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import type { Expression } from '@/types';
import { EXPRESSION_ORDER } from '@/lib/constants';

const VALID_EXPRESSIONS = new Set<Expression>(EXPRESSION_ORDER);
const DEFAULT_TIMEOUT_MS = 120_000;

interface StickerImageBody {
  prompt: string;
  expression: Expression;
}

function validateBody(body: unknown): { valid: true; data: StickerImageBody } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body harus berupa JSON object.' };
  }

  const b = body as Record<string, unknown>;
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';
  if (prompt.length < 5) {
    return { valid: false, error: 'Prompt gambar minimal 5 karakter.' };
  }
  if (prompt.length > 5000) {
    return { valid: false, error: 'Prompt gambar maksimal 5000 karakter.' };
  }

  if (!VALID_EXPRESSIONS.has(b.expression as Expression)) {
    return { valid: false, error: 'Expression tidak valid.' };
  }

  return {
    valid: true,
    data: {
      prompt,
      expression: b.expression as Expression,
    },
  };
}

function getTimeoutMs(): number {
  const raw = Number(process.env.STICKER_IMAGE_API_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

async function readUpstreamMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).message === 'string') {
      return (payload as Record<string, string>).message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text.trim()) return text.trim();
    } catch {
      return `HTTP ${response.status}`;
    }
  }
  return `HTTP ${response.status}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ message: 'Request body tidak valid (bukan JSON).' }, { status: 400 });
  }

  const validation = validateBody(rawBody);
  if (!validation.valid) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  const serviceUrl = process.env.STICKER_IMAGE_API_URL?.trim();
  if (!serviceUrl) {
    return NextResponse.json({ message: 'STICKER_IMAGE_API_URL belum dikonfigurasi.' }, { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const upstream = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const message = await readUpstreamMessage(upstream);
      return NextResponse.json({ message: `Local image service gagal: ${message}` }, { status: 502 });
    }

    const payload = await upstream.json().catch(() => null);
    const imageUrl = payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>).imageUrl
      : null;

    if (typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      return NextResponse.json({ message: 'Local image service tidak mengembalikan imageUrl.' }, { status: 502 });
    }

    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json(
      { message: 'Local image service tidak merespons. Pastikan FLUX.1 + rembg sedang berjalan.' },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run route tests and verify GREEN**

Run: `npm run test -- src/app/api/sticker-image/route.test.ts`

Expected: PASS for all `/api/sticker-image` tests.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/app/api/sticker-image/route.ts src/app/api/sticker-image/route.test.ts
git commit -m "feat: proxy local sticker image generation"
```

---

### Task 2: Sticker Card Image Controls

**Files:**
- Create: `src/components/__tests__/StickerCard.test.tsx`
- Modify: `src/components/StickerCard.tsx`
- Modify: `src/components/StickerGrid.tsx`

- [ ] **Step 1: Write failing component tests**

Add `src/components/__tests__/StickerCard.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StickerCard } from '../StickerCard';
import type { StickerPrompt } from '@/types';

const sticker: StickerPrompt = {
  expression: 'happy',
  title: 'Blue Cat Joy',
  emoji: ':)',
  prompt: 'cute blue cat happy sticker',
  tips: 'Pakai langsung',
};

describe('StickerCard image generation', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders sticker image controls for sticker products', () => {
    render(
      <StickerCard
        sticker={sticker}
        onRegenerate={vi.fn()}
        isRegenerating={false}
        index={0}
        targetProduct="sticker"
      />
    );

    expect(screen.getByRole('button', { name: /generate image/i })).toBeInTheDocument();
  });

  it('does not render image controls for phone case or t-shirt products', () => {
    const { rerender } = render(
      <StickerCard
        sticker={sticker}
        onRegenerate={vi.fn()}
        isRegenerating={false}
        index={0}
        targetProduct="phone-case"
      />
    );

    expect(screen.queryByRole('button', { name: /generate image/i })).not.toBeInTheDocument();

    rerender(
      <StickerCard
        sticker={sticker}
        onRegenerate={vi.fn()}
        isRegenerating={false}
        index={0}
        targetProduct="t-shirt"
      />
    );

    expect(screen.queryByRole('button', { name: /generate image/i })).not.toBeInTheDocument();
  });

  it('generates the image from the current edited prompt', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ imageUrl: 'data:image/png;base64,abc123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <StickerCard
        sticker={sticker}
        onRegenerate={vi.fn()}
        isRegenerating={false}
        index={0}
        targetProduct="sticker"
      />
    );

    await user.click(screen.getByRole('button', { name: /edit prompt/i }));
    await user.clear(screen.getByLabelText('Edit prompt untuk Blue Cat Joy'));
    await user.type(screen.getByLabelText('Edit prompt untuk Blue Cat Joy'), 'edited transparent sticker prompt');
    await user.click(screen.getByRole('button', { name: /generate image/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/sticker-image',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'edited transparent sticker prompt',
            expression: 'happy',
          }),
        })
      );
    });
  });

  it('shows the generated image preview and download control', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ imageUrl: 'data:image/png;base64,abc123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    render(
      <StickerCard
        sticker={sticker}
        onRegenerate={vi.fn()}
        isRegenerating={false}
        index={0}
        targetProduct="sticker"
      />
    );

    await user.click(screen.getByRole('button', { name: /generate image/i }));

    expect(await screen.findByRole('img', { name: /generated sticker image/i })).toHaveAttribute(
      'src',
      'data:image/png;base64,abc123'
    );
    expect(screen.getByRole('link', { name: /download image/i })).toHaveAttribute(
      'href',
      'data:image/png;base64,abc123'
    );
  });
});
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm run test -- src/components/__tests__/StickerCard.test.tsx`

Expected: FAIL because `StickerCard` does not accept `targetProduct` and image controls do not exist.

- [ ] **Step 3: Implement sticker-only image controls**

Modify `src/components/StickerCard.tsx`:

```tsx
"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Pencil, ImagePlus, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopy } from '@/hooks/useCopy';
import { EXPRESSIONS } from '@/lib/constants';
import type { StickerPrompt, Expression, ProductType } from '@/types';

interface StickerCardProps {
  sticker: StickerPrompt;
  onRegenerate: (expression: Expression) => void;
  isRegenerating: boolean;
  index: number;
  targetProduct: ProductType;
}

type ImageStatus = 'idle' | 'generating' | 'done' | 'error';

export function StickerCard({
  sticker,
  onRegenerate,
  isRegenerating,
  index,
  targetProduct,
}: StickerCardProps) {
  const { copied, copy } = useCopy();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(sticker.prompt);
  const [imageStatus, setImageStatus] = useState<ImageStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const meta = EXPRESSIONS[sticker.expression];
  const displayTitle = sticker.title ?? meta.label;
  const activePrompt = isEditing ? editedPrompt : sticker.prompt;
  const showImageControls = targetProduct === 'sticker';

  const handleCopy = useCallback(() => {
    copy(activePrompt);
  }, [copy, activePrompt]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedPrompt(sticker.prompt);
      setIsEditing(true);
    }
  }, [isEditing, sticker.prompt]);

  const handleGenerateImage = useCallback(async () => {
    setImageStatus('generating');
    setImageError(null);

    try {
      const response = await fetch('/api/sticker-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          expression: sticker.expression,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload.message === 'string'
            ? payload.message
            : 'Gagal generate image sticker.'
        );
      }

      if (typeof payload.imageUrl !== 'string' || payload.imageUrl.trim().length === 0) {
        throw new Error('Response image tidak valid.');
      }

      setImageUrl(payload.imageUrl);
      setImageStatus('done');
    } catch (err) {
      setImageStatus('error');
      setImageError((err as Error).message || 'Gagal generate image sticker.');
    }
  }, [activePrompt, sticker.expression]);

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.07,
        type: 'spring',
        stiffness: 280,
        damping: 22,
      }}
      className="kawaii-card p-4 flex flex-col gap-3"
      aria-label={`Prompt ${displayTitle}: ${meta.description}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={displayTitle}>
            {sticker.emoji}
          </span>
          <div>
            <p className="font-display font-bold text-sm text-kawaii-text leading-tight">
              {displayTitle}
            </p>
            <p className="font-body text-xs text-kawaii-muted">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {isEditing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full text-xs font-mono bg-primary-50 border border-primary-200 rounded-kawaii-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 text-kawaii-text"
            rows={5}
            aria-label={`Edit prompt untuk ${displayTitle}`}
          />
        ) : (
          <p className="text-xs font-mono text-kawaii-text bg-kawaii-bg rounded-kawaii-sm p-2.5 leading-relaxed break-words select-all cursor-text border border-kawaii-border">
            {sticker.prompt}
          </p>
        )}
      </div>

      {showImageControls && (
        <div className="rounded-kawaii-sm border border-kawaii-border bg-white/70 p-2.5 space-y-2">
          <div className="aspect-square rounded-kawaii-sm bg-kawaii-bg border border-kawaii-border overflow-hidden flex items-center justify-center">
            {imageStatus === 'generating' && (
              <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" aria-hidden="true" />
            )}
            {imageStatus === 'done' && imageUrl && (
              <img
                src={imageUrl}
                alt={`Generated sticker image for ${displayTitle}`}
                className="w-full h-full object-contain"
              />
            )}
            {(imageStatus === 'idle' || imageStatus === 'error') && (
              <ImagePlus className="w-5 h-5 text-kawaii-muted" aria-hidden="true" />
            )}
          </div>

          {imageStatus === 'error' && imageError && (
            <p className="text-xs font-body text-secondary-600 leading-snug" role="alert">
              {imageError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={imageStatus === 'generating'}
              className="flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm text-xs font-body font-semibold transition-all flex-1 justify-center bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Generate image ${displayTitle}`}
            >
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              {imageStatus === 'generating' ? 'Generating...' : 'Generate Image'}
            </button>

            {imageUrl && (
              <a
                href={imageUrl}
                download={`stickerforge-${sticker.expression}.png`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm text-xs font-body font-semibold transition-all bg-accent-200 text-green-700 border border-accent-300 hover:bg-accent-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1"
                aria-label={`Download image ${displayTitle}`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}

      {sticker.tips && (
        <p className="text-xs text-kawaii-muted font-body italic leading-snug">
          {sticker.tips}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all flex-1 justify-center',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            copied
              ? 'bg-accent-200 text-green-700 border border-accent-300'
              : 'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 active:scale-95'
          )}
          aria-label={copied ? 'Tersalin!' : `Salin prompt ${displayTitle}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {copied ? 'Tersalin!' : 'Salin'}
        </button>

        <button
          onClick={handleEditToggle}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            isEditing
              ? 'bg-accent-200 text-green-700 border border-accent-300 hover:bg-accent-300'
              : 'bg-kawaii-bg text-kawaii-muted border border-kawaii-border hover:bg-primary-50 active:scale-95'
          )}
          aria-label={isEditing ? 'Simpan perubahan' : `Edit prompt ${displayTitle}`}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          {isEditing ? 'OK' : 'Edit'}
        </button>

        <button
          onClick={() => onRegenerate(sticker.expression)}
          disabled={isRegenerating}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all',
            'focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-1',
            'bg-secondary-100 text-secondary-500 border border-secondary-200',
            'hover:bg-secondary-200 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={`Regenerate prompt ${displayTitle}`}
          aria-busy={isRegenerating}
        >
          <RefreshCw
            className={clsx('w-3.5 h-3.5', isRegenerating && 'animate-spin')}
            aria-hidden="true"
          />
        </button>
      </div>
    </motion.article>
  );
}
```

Modify the `StickerCard` call in `src/components/StickerGrid.tsx`:

```tsx
<StickerCard
  sticker={sticker}
  onRegenerate={onRegenerate}
  isRegenerating={isGenerating}
  index={idx}
  targetProduct={targetProduct}
/>
```

- [ ] **Step 4: Run component tests and verify GREEN**

Run: `npm run test -- src/components/__tests__/StickerCard.test.tsx`

Expected: PASS for all `StickerCard` image generation tests.

- [ ] **Step 5: Run relevant existing component tests**

Run: `npm run test -- src/components/__tests__/GenerationOptionsSelectors.test.tsx src/app/api/generate/route.test.ts`

Expected: PASS. The prompt generation route and option selectors remain unchanged.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/components/StickerCard.tsx src/components/StickerGrid.tsx src/components/__tests__/StickerCard.test.tsx
git commit -m "feat: add sticker image controls"
```

---

### Task 3: Environment Documentation and Full Verification

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update environment example**

Append to `.env.example`:

```env
# Local sticker image service
# Jalankan service FLUX.1 + rembg terpisah, lalu arahkan endpoint ini ke service tersebut.
STICKER_IMAGE_API_URL=http://localhost:8000/generate-sticker
STICKER_IMAGE_API_TIMEOUT_MS=120000
```

- [ ] **Step 2: Run full tests**

Run: `npm run test`

Expected: PASS for all Vitest suites.

- [ ] **Step 3: Run type check**

Run: `npm run type-check`

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS. Next.js builds the app and route handlers successfully.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add .env.example
git commit -m "docs: document local sticker image service"
```

---

## Self-Review

- Spec coverage: API proxy, sticker-only UI gating, preview, download, error handling, and env docs are covered by Tasks 1-3.
- Completion marker scan: no unfinished marker or fill-in steps are present.
- Type consistency: `ProductType`, `Expression`, `StickerPrompt`, `imageUrl`, and `/api/sticker-image` naming are consistent across tasks.
