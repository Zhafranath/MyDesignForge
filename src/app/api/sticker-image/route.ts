import { NextRequest, NextResponse } from 'next/server';
import type { Expression } from '@/types';
import { EXPRESSION_ORDER } from '@/lib/constants';

const VALID_EXPRESSIONS = new Set<Expression>(EXPRESSION_ORDER);
const DEFAULT_TIMEOUT_MS = 600_000;

interface StickerImageBody {
  prompt: string;
  expression: Expression;
}

function validateBody(
  body: unknown
): { valid: true; data: StickerImageBody } | { valid: false; error: string } {
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
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const message = record ? record.message : null;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    const detail = record ? record.detail : null;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
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
    return NextResponse.json(
      { message: 'Request body tidak valid (bukan JSON).' },
      { status: 400 }
    );
  }

  const validation = validateBody(rawBody);
  if (!validation.valid) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  const serviceUrl = process.env.STICKER_IMAGE_API_URL?.trim();
  if (!serviceUrl) {
    return NextResponse.json(
      { message: 'STICKER_IMAGE_API_URL belum dikonfigurasi.' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { message: `Local image service gagal: ${message}` },
        { status: 502 }
      );
    }

    const payload = await upstream.json().catch(() => null);
    const imageUrl = payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>).imageUrl
      : null;

    if (typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      return NextResponse.json(
        { message: 'Local image service tidak mengembalikan imageUrl.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json(
      {
        message:
          'Local image service tidak merespons. Pastikan SDXL Turbo + rembg sedang berjalan.',
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
