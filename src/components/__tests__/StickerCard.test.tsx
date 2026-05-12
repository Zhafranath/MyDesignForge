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
