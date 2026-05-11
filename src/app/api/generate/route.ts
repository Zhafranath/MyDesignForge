import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { CharacterForm, DesignTheme, GenerationOptions, Platform, Expression, ProductType, TextMode } from '@/types';
import { buildSystemPrompt, buildRegeneratePrompt } from '@/lib/prompts';
import {
  CHARACTER_FORM_ORDER,
  DESIGN_THEME_ORDER,
  EXPRESSION_ORDER,
  MAX_CUSTOM_TEXT_LENGTH,
  PRODUCT_ORDER,
  TEXT_MODE_ORDER,
} from '@/lib/constants';

// ─── Rate limiting (simple in-memory, resets on cold start) ──────────────────
// For production, replace with Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// ─── Input validation ─────────────────────────────────────────────────────────

const VALID_PLATFORMS = new Set<Platform>([
  'midjourney', 'dalle', 'stable-diffusion', 'kling', 'runway',
]);

const VALID_EXPRESSIONS = new Set<string>(EXPRESSION_ORDER);
const VALID_PRODUCTS = new Set<ProductType>(PRODUCT_ORDER);
const VALID_CHARACTER_FORMS = new Set<CharacterForm>(CHARACTER_FORM_ORDER);
const VALID_TEXT_MODES = new Set<TextMode>(TEXT_MODE_ORDER);
const VALID_DESIGN_THEMES = new Set<DesignTheme>(DESIGN_THEME_ORDER);

interface GenerateBody {
  description: string;
  platform: Platform;
  targetProduct?: ProductType;
  characterForm: CharacterForm;
  textMode: TextMode;
  theme: DesignTheme;
  customText?: string;
  regenerate?: {
    expression: Expression;
    concept: {
      name: string;
      description: string;
      colors: string[];
      style: string;
      productFit?: string;
      tags?: string[];
      characterType?: string;
    };
  };
}

function validateBody(body: unknown): { valid: true; data: GenerateBody } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body harus berupa JSON object.' };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.description !== 'string' || b.description.trim().length < 5) {
    return { valid: false, error: 'Deskripsi karakter minimal 5 karakter.' };
  }
  if (b.description.length > 700) {
    return { valid: false, error: 'Deskripsi karakter maksimal 700 karakter.' };
  }
  if (!VALID_PLATFORMS.has(b.platform as Platform)) {
    return { valid: false, error: 'Platform tidak valid.' };
  }

  if (b.targetProduct !== undefined && !VALID_PRODUCTS.has(b.targetProduct as ProductType)) {
    return { valid: false, error: 'Target produk tidak valid.' };
  }

  const characterForm = (b.characterForm ?? 'auto') as CharacterForm;
  if (!VALID_CHARACTER_FORMS.has(characterForm)) {
    return { valid: false, error: 'Bentuk karakter tidak valid.' };
  }

  const textMode = (b.textMode ?? 'none') as TextMode;
  if (!VALID_TEXT_MODES.has(textMode)) {
    return { valid: false, error: 'Mode tulisan tidak valid.' };
  }

  const theme = (b.theme ?? 'auto') as DesignTheme;
  if (!VALID_DESIGN_THEMES.has(theme)) {
    return { valid: false, error: 'Tema desain tidak valid.' };
  }

  const customText = typeof b.customText === 'string' ? b.customText.trim() : '';
  if (textMode === 'custom' && customText.length === 0) {
    return { valid: false, error: 'Teks custom wajib diisi jika memilih tulisan custom.' };
  }
  if (customText.length > MAX_CUSTOM_TEXT_LENGTH) {
    return { valid: false, error: `Teks custom maksimal ${MAX_CUSTOM_TEXT_LENGTH} karakter.` };
  }

  if (b.regenerate !== undefined) {
    const r = b.regenerate as Record<string, unknown>;
    if (!VALID_EXPRESSIONS.has(r.expression as string)) {
      return { valid: false, error: 'Expression tidak valid untuk regenerate.' };
    }
    if (typeof r.concept !== 'object' || r.concept === null) {
      return { valid: false, error: 'Concept object diperlukan untuk regenerate.' };
    }
  }

  return {
    valid: true,
    data: {
      ...(b as unknown as GenerateBody),
      characterForm,
      textMode,
      theme,
      customText,
    },
  };
}

function extractCompleteJsonObjects(input: string): { objects: string[]; rest: string } {
  const objects: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (start === -1) {
      if (char === '{') {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        objects.push(input.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return { objects, rest: start === -1 ? '' : input.slice(start) };
}

function enqueueNdjson(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  jsonText: string
) {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      controller.enqueue(encoder.encode(`${JSON.stringify(parsed)}\n`));
    }
  } catch {
    // Ignore malformed JSON from the model and keep streaming later objects.
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  // ── Rate limiting ──
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { type: 'error', message: 'Terlalu banyak request. Tunggu sebentar ya! ✋' },
      { status: 429 }
    );
  }

  // ── Parse & validate ──
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { type: 'error', message: 'Request body tidak valid (bukan JSON).' },
      { status: 400 }
    );
  }

  const validation = validateBody(rawBody);
  if (!validation.valid) {
    return NextResponse.json(
      { type: 'error', message: validation.error },
      { status: 400 }
    );
  }

  const { description, platform, regenerate, characterForm, textMode, theme, customText } = validation.data;
  const targetProduct = validation.data.targetProduct ?? 'sticker';
  const generationOptions: GenerationOptions = { characterForm, textMode, theme, customText };

  // ── Init Groq client ──
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { type: 'error', message: 'API key belum dikonfigurasi. Set GROQ_API_KEY di environment.' },
      { status: 500 }
    );
  }

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

  // ── Build prompt ──
  const isRegenerate = !!regenerate;
  const systemPrompt = isRegenerate
    ? buildRegeneratePrompt(regenerate!.concept, regenerate!.expression, platform, targetProduct, generationOptions)
    : buildSystemPrompt(platform, targetProduct, generationOptions);

  const userMessage = isRegenerate
    ? `Regenerate the "${regenerate!.expression}" expression sticker.`
    : description.trim();

  // ── Stream response ──
  try {
    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.95,
      max_tokens: isRegenerate ? 768 : 4096,
      stream: true,
    });

    // Transform Groq SSE → NDJSON passthrough
    const encoder = new TextEncoder();
    let buffer = '';

    const readable = new ReadableStream({
      async start(controller) {
        const flushCompleteObjects = () => {
          const { objects, rest } = extractCompleteJsonObjects(buffer);
          buffer = rest;
          for (const objectText of objects) {
            enqueueNdjson(controller, encoder, objectText);
          }
        };

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (!delta) continue;

            buffer += delta;
            flushCompleteObjects();
          }
          flushCompleteObjects();
        } catch (streamError) {
          const errPayload = JSON.stringify({
            type: 'error',
            message: 'Terjadi error saat generate. Coba lagi ya! 🙏',
          });
          controller.enqueue(encoder.encode(errPayload + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('API key')
        ? 'Groq API key tidak valid. Periksa konfigurasi kamu.'
        : 'Server sedang sibuk. Coba lagi dalam beberapa detik! ⏳';
    return NextResponse.json({ type: 'error', message }, { status: 503 });
  }
}
