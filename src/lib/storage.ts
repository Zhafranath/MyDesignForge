import type { StickerPack } from '@/types';
import { STORAGE_KEY, MAX_HISTORY } from './constants';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getHistory(): StickerPack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Guard: must be an array of objects with expected shape
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPack);
  } catch {
    // Corrupt storage — wipe and start fresh
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function savePack(pack: StickerPack): void {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const updated = [pack, ...history.filter((p) => p.id !== pack.id)];
  // FIFO eviction: keep newest MAX_HISTORY packs only
  const trimmed = updated.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deletePack(id: string): void {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.filter((p) => p.id !== id))
  );
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal runtime type guard for a StickerPack loaded from localStorage */
function isValidPack(obj: unknown): obj is StickerPack {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.createdAt === 'string' &&
    typeof p.platform === 'string' &&
    typeof p.inputDescription === 'string' &&
    typeof p.concept === 'object' &&
    Array.isArray(p.stickers)
  );
}

/** Generate a simple unique ID (crypto.randomUUID with fallback) */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
