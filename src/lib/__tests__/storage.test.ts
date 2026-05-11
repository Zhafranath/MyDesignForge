import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, savePack, deletePack, clearHistory } from '../storage';
import type { StickerPack } from '@/types';

const makePack = (id: string): StickerPack => ({
  id,
  createdAt: new Date().toISOString(),
  platform: 'midjourney',
  targetProduct: 'sticker',
  inputDescription: 'Test character',
  concept: {
    name: 'Test Cat',
    tagline: 'The cutest test cat',
    description: 'A test cat for unit testing purposes.',
    colors: ['#C9B8FF'],
    style: 'chibi kawaii',
  },
  stickers: [],
});

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no history exists', () => {
    expect(getHistory()).toEqual([]);
  });

  it('saves a pack and retrieves it', () => {
    const pack = makePack('pack-1');
    savePack(pack);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('pack-1');
  });

  it('prepends new packs (newest first)', () => {
    savePack(makePack('pack-1'));
    savePack(makePack('pack-2'));
    const history = getHistory();
    expect(history[0].id).toBe('pack-2');
    expect(history[1].id).toBe('pack-1');
  });

  it('evicts oldest packs when MAX_HISTORY exceeded', () => {
    // Save 21 packs; only 20 should remain
    for (let i = 1; i <= 21; i++) {
      savePack(makePack(`pack-${i}`));
    }
    const history = getHistory();
    expect(history).toHaveLength(20);
    // pack-1 (oldest) should be gone
    expect(history.find((p) => p.id === 'pack-1')).toBeUndefined();
  });

  it('deduplicates by id (re-save same id updates in place)', () => {
    const pack = makePack('pack-1');
    savePack(pack);
    savePack({ ...pack, inputDescription: 'Updated' });
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].inputDescription).toBe('Updated');
  });

  it('deletes a specific pack', () => {
    savePack(makePack('pack-1'));
    savePack(makePack('pack-2'));
    deletePack('pack-1');
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('pack-2');
  });

  it('clears all history', () => {
    savePack(makePack('pack-1'));
    savePack(makePack('pack-2'));
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('returns empty array on corrupt localStorage data', () => {
    localStorage.setItem('stickerforge_history', 'not-valid-json{{{');
    expect(getHistory()).toEqual([]);
  });
});
