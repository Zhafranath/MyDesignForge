import { describe, expect, it, vi, beforeEach } from 'vitest';

const groqOutput = `{
  "type": "concept",
  "name": "Blue Cat",
  "tagline": "Cute",
  "description": "A cute blue cat",
  "colors": ["#87CEEB"],
  "style": "kawaii",
  "productFit": "Cocok untuk sticker karena bentuknya sederhana.",
  "tags": ["cute cat", "kawaii"]
}

{
  "type": "design",
  "expression": "happy",
  "title": "Blue Cat Joy",
  "emoji": ":)",
  "prompt": "blue cat happy sticker",
  "tips": "Pakai langsung"
}
`;

const { groqCreateCalls } = vi.hoisted(() => ({
  groqCreateCalls: [] as unknown[],
}));

vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    chat = {
      completions: {
        create: vi.fn((request: unknown) => {
          groqCreateCalls.push(request);
          const serialized = JSON.stringify(request);
          if (serialized.includes('image_url')) {
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: 'A round blue cat mascot with tiny yellow scarf, sleepy eyes, and star cheek marks.',
                  },
                },
              ],
            });
          }

          return (async function* () {
            yield { choices: [{ delta: { content: groqOutput } }] };
          })();
        }),
      },
    };
  },
}));

describe('POST /api/generate', () => {
  beforeEach(() => {
    groqCreateCalls.length = 0;
    process.env.GROQ_API_KEY = 'test-key';
    process.env.GROQ_MODEL = 'test-model';
    process.env.GROQ_VISION_MODEL = 'test-vision-model';
  });

  async function postGenerate(body: Record<string, unknown>) {
    const { POST } = await import('./route');
    return POST(
      new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }) as never
    );
  }

  it('streams pretty-printed Groq JSON objects as NDJSON lines', async () => {
    const response = await postGenerate({
      description: 'kucing lucu warna biru',
      platform: 'midjourney',
      targetProduct: 'sticker',
    });

    const text = await response.text();

    expect(text.trim().split('\n')).toEqual([
      JSON.stringify({
        type: 'concept',
        name: 'Blue Cat',
        tagline: 'Cute',
        description: 'A cute blue cat',
        colors: ['#87CEEB'],
        style: 'kawaii',
        productFit: 'Cocok untuk sticker karena bentuknya sederhana.',
        tags: ['cute cat', 'kawaii'],
      }),
      JSON.stringify({
        type: 'design',
        expression: 'happy',
        title: 'Blue Cat Joy',
        emoji: ':)',
        prompt: 'blue cat happy sticker',
        tips: 'Pakai langsung',
      }),
    ]);
  });

  it('rejects invalid character form', async () => {
    const response = await postGenerate({
      description: 'kucing lucu warna biru',
      platform: 'midjourney',
      targetProduct: 'sticker',
      characterForm: 'not-a-form',
      textMode: 'none',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Bentuk karakter tidak valid.',
    });
  });

  it('rejects invalid text mode', async () => {
    const response = await postGenerate({
      description: 'kucing lucu warna biru',
      platform: 'midjourney',
      targetProduct: 'sticker',
      characterForm: 'animal',
      textMode: 'maybe-text',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Mode tulisan tidak valid.',
    });
  });

  it('requires custom text for custom text mode', async () => {
    const response = await postGenerate({
      description: 'kucing lucu warna biru',
      platform: 'midjourney',
      targetProduct: 'sticker',
      characterForm: 'animal',
      textMode: 'custom',
      customText: '   ',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Teks custom wajib diisi jika memilih tulisan custom.',
    });
  });

  it('rejects invalid design theme', async () => {
    const response = await postGenerate({
      description: 'kucing lucu warna biru',
      platform: 'midjourney',
      targetProduct: 'sticker',
      characterForm: 'animal',
      textMode: 'none',
      theme: 'too-much-stuff',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Tema desain tidak valid.',
    });
  });

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
    await response.text();
    expect(groqCreateCalls).toHaveLength(2);
    expect(JSON.stringify(groqCreateCalls[0])).toContain('image_url');
    expect(JSON.stringify(groqCreateCalls[1])).toContain('REFERENCE IMAGE CHARACTER LOCK');
  });
});
