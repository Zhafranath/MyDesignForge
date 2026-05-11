import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from '../prompts';

describe('buildSystemPrompt generation options', () => {
  it('locks a selected character form into the concept and prompts', () => {
    const prompt = buildSystemPrompt('midjourney', 'sticker', {
      characterForm: 'animal',
      textMode: 'none',
      theme: 'auto',
    });

    expect(prompt).toContain('Selected character form: animal');
    expect(prompt).toContain('The concept characterType must match this selected form');
  });

  it('forbids text when textMode is none', () => {
    const prompt = buildSystemPrompt('dalle', 'sticker', {
      characterForm: 'auto',
      textMode: 'none',
      theme: 'auto',
    });

    expect(prompt).toContain('Do not include readable text');
    expect(prompt).toContain('no lettering, no typography, no captions, no speech bubbles');
  });

  it('requests expression-matching text when textMode is auto', () => {
    const prompt = buildSystemPrompt('stable-diffusion', 't-shirt', {
      characterForm: 'stickman',
      textMode: 'auto',
      theme: 'auto',
    });

    expect(prompt).toContain('Every prompt string must explicitly mention Stickman');
    expect(prompt).toContain('Include one short original phrase');
    expect(prompt).toContain('match each expression');
    expect(prompt).toContain('Each prompt string must explicitly include the visible phrase in quotes');
  });

  it('uses exact custom text when textMode is custom', () => {
    const prompt = buildSystemPrompt('runway', 'phone-case', {
      characterForm: 'fantasy-creature',
      textMode: 'custom',
      theme: 'auto',
      customText: 'boo!',
    });

    expect(prompt).toContain('Use this exact text: "boo!"');
    expect(prompt).toContain('Do not translate, paraphrase, or change the spelling');
  });

  it('limits accessories when controlled accessory theme is selected', () => {
    const prompt = buildSystemPrompt('midjourney', 'sticker', {
      characterForm: 'stickman',
      textMode: 'auto',
      theme: 'controlled-accessories',
    });

    expect(prompt).toContain('Selected design theme: controlled-accessories');
    expect(prompt).toContain('Use only 2-4 relevant accessories or props');
    expect(prompt).toContain('do not use every possible accessory');
  });
});
