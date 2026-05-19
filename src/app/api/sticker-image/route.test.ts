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
        new Response(JSON.stringify({ detail: 'GPU busy' }), {
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

  it('surfaces detail messages from upstream HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail:
              '403 Client Error. Cannot access gated repo for url https://huggingface.co/...',
          }),
          {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }
        )
      )
    );

    const response = await postStickerImage({
      prompt: 'cute blue cat sticker',
      expression: 'happy',
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      message:
        'Local image service gagal: 403 Client Error. Cannot access gated repo for url https://huggingface.co/...',
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
      message: 'Local image service tidak merespons. Pastikan SDXL Turbo + rembg sedang berjalan.',
    });
  });
});
