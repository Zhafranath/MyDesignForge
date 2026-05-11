import { useState, useCallback, useEffect } from 'react';
import type { StickerPack } from '@/types';
import { getHistory, savePack, deletePack, clearHistory } from '@/lib/storage';

interface UseHistoryReturn {
  history: StickerPack[];
  save: (pack: StickerPack) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<StickerPack[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const save = useCallback((pack: StickerPack) => {
    savePack(pack);
    setHistory(getHistory());
  }, []);

  const remove = useCallback((id: string) => {
    deletePack(id);
    setHistory((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, save, remove, clear };
}
