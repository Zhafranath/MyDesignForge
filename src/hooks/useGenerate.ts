import { useState, useCallback, useRef } from 'react';
import type {
  GenerateState,
  GenerationOptions,
  Platform,
  ProductType,
  Expression,
  CharacterConcept,
  StickerPrompt,
  StreamEvent,
} from '@/types';
import { EXPRESSION_ORDER } from '@/lib/constants';

const INITIAL_STATE: GenerateState = {
  status: 'idle',
  concept: null,
  stickers: [],
  error: null,
};

interface UseGenerateReturn {
  state: GenerateState;
  generate: (
    description: string,
    platform: Platform,
    targetProduct: ProductType,
    generationOptions: GenerationOptions
  ) => Promise<void>;
  regenerateOne: (
    expression: Expression,
    concept: CharacterConcept,
    platform: Platform,
    targetProduct: ProductType,
    generationOptions: GenerationOptions
  ) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useGenerate(description: string): UseGenerateReturn {
  const [state, setState] = useState<GenerateState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const beginRequest = useCallback(() => {
    abortRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    abortRef.current = controller;

    setState({ status: 'generating', concept: null, stickers: [], error: null });
    return { controller, requestId };
  }, []);

  const isCurrentRequest = useCallback((requestId: number) => {
    return requestId === requestSeqRef.current;
  }, []);

  const streamFromApi = useCallback(
    async (body: Record<string, unknown>): Promise<void> => {
      const { controller, requestId } = beginRequest();

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            (errData as Record<string, string>).message ?? 'Gagal connect ke server.'
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            let event: StreamEvent;
            try {
              event = JSON.parse(trimmed) as StreamEvent;
            } catch {
              continue;
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }

            if (event.type === 'concept') {
              if (!isCurrentRequest(requestId)) return;
              setState((prev) => ({
                ...prev,
                concept: {
                  name: event.name,
                  tagline: event.tagline,
                  characterType: event.characterType,
                  description: event.description,
                  colors: event.colors,
                  style: event.style,
                  productFit: event.productFit,
                  tags: event.tags,
                },
              }));
              continue;
            }

            if (event.type === 'design' || event.type === 'sticker') {
              if (!isCurrentRequest(requestId)) return;
              const sticker: StickerPrompt = {
                expression: event.expression,
                title: event.title,
                emoji: event.emoji,
                prompt: event.prompt,
                tips: event.tips,
              };
              setState((prev) => ({
                ...prev,
                stickers: mergeSticker(prev.stickers, sticker),
              }));
            }
          }
        }

        if (isCurrentRequest(requestId)) {
          setState((prev) => ({ ...prev, status: 'done' }));
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          if (isCurrentRequest(requestId)) {
            setState(INITIAL_STATE);
          }
          return;
        }

        if (!isCurrentRequest(requestId)) {
          return;
        }

        setState((prev) => ({
          ...prev,
          status: 'error',
          error: (err as Error).message || 'Terjadi kesalahan. Coba lagi ya!',
        }));
      }
    },
    [beginRequest, isCurrentRequest]
  );

  const generate = useCallback(
    async (
      desc: string,
      platform: Platform,
      targetProduct: ProductType,
      generationOptions: GenerationOptions
    ) => {
      await streamFromApi({ description: desc, platform, targetProduct, ...generationOptions });
    },
    [streamFromApi]
  );

  const regenerateOne = useCallback(
    async (
      expression: Expression,
      concept: CharacterConcept,
      platform: Platform,
      targetProduct: ProductType,
      generationOptions: GenerationOptions
    ) => {
      const { controller, requestId } = beginRequest();

      setState((prev) => ({
        ...prev,
        stickers: prev.stickers.filter((s) => s.expression !== expression),
      }));

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            platform,
            targetProduct,
            ...generationOptions,
            regenerate: { expression, concept },
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error('Gagal connect ke server.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!isCurrentRequest(requestId)) return;
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed) as StreamEvent;
              if (event.type === 'design' || event.type === 'sticker') {
                if (!isCurrentRequest(requestId)) return;
                const sticker: StickerPrompt = {
                  expression: event.expression,
                  title: event.title,
                  emoji: event.emoji,
                  prompt: event.prompt,
                  tips: event.tips,
                };
                setState((prev) => ({
                  ...prev,
                  status: 'done',
                  stickers: mergeSticker(prev.stickers, sticker),
                }));
              }
            } catch {
              continue;
            }
          }
        }

        if (isCurrentRequest(requestId)) {
          setState((prev) => ({ ...prev, status: 'done' }));
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        if (!isCurrentRequest(requestId)) {
          return;
        }
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: (err as Error).message || 'Terjadi kesalahan. Coba lagi ya!',
        }));
      }
    },
    [beginRequest, description, isCurrentRequest]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { state, generate, regenerateOne, reset, abort };
}

function mergeSticker(existing: StickerPrompt[], incoming: StickerPrompt): StickerPrompt[] {
  const map = new Map(existing.map((s) => [s.expression, s]));
  map.set(incoming.expression, incoming);
  return EXPRESSION_ORDER.flatMap((expr) => {
    const s = map.get(expr);
    return s ? [s] : [];
  });
}
