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

vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    chat = {
      completions: {
        create: vi.fn(async function* () {
          yield { choices: [{ delta: { content: groqOutput } }] };
        }),
      },
    };
  },
}));

describe('POST /api/generate', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
    process.env.GROQ_MODEL = 'test-model';
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
});
