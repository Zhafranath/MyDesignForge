import { afterEach, describe, it, expect, vi } from 'vitest';
import { RANDOM_IDEAS, getRandomIdea } from '../randomIdeas';

describe('randomIdeas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps at least 20 curated seed ideas', () => {
    expect(RANDOM_IDEAS.length).toBeGreaterThanOrEqual(20);
  });

  it('returns a usable idea string', () => {
    const idea = getRandomIdea();
    expect(typeof idea).toBe('string');
    expect(idea.length).toBeGreaterThan(20);
  });

  it('can generate ideas outside the static seed list', () => {
    const results = new Set(Array.from({ length: 80 }, () => getRandomIdea()));
    expect(results.size).toBeGreaterThan(10);
  });

  it('tries to avoid returning the current idea', () => {
    const current = RANDOM_IDEAS[0];
    for (let i = 0; i < 30; i++) {
      const result = getRandomIdea(current);
      expect(result).not.toBe(current);
    }
  });

  it('aligns shuffled ideas with selected stickman and automatic text options', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.26);

    const idea = getRandomIdea(undefined, {
      characterForm: 'stickman',
      textMode: 'auto',
      customText: '',
    });

    expect(idea.toLowerCase()).toContain('stickman');
    expect(idea.toLowerCase()).toContain('tulisan otomatis');
    expect(idea.toLowerCase()).toContain('1-5 kata');
  });

  it('aligns shuffled ideas with selected controlled accessory theme', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.26);

    const idea = getRandomIdea(undefined, {
      characterForm: 'stickman',
      textMode: 'none',
      customText: '',
      theme: 'controlled-accessories',
    });

    expect(idea.toLowerCase()).toContain('full acc terkontrol');
    expect(idea.toLowerCase()).toContain('2-4 aksesori');
  });
});
