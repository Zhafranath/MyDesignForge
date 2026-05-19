import { describe, expect, it } from 'vitest';
import { buildRegeneratePrompt, buildSystemPrompt } from '../prompts';

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

  it('makes custom sticker text prominent and exact in structured prompts', () => {
    const prompt = buildSystemPrompt('stable-diffusion', 'sticker', {
      characterForm: 'animal',
      textMode: 'custom',
      theme: 'simple-cute',
      customText: 'WOW!',
    });

    expect(prompt).toContain('Text in design: [must be exactly text reading "WOW!"');
    expect(prompt).toContain('large readable hand-lettered text');
    expect(prompt).toContain('do not omit the text');
    expect(prompt).toContain('misspelled lettering');
  });

  it('limits accessories when controlled accessory theme is selected', () => {
    const prompt = buildSystemPrompt('midjourney', 'sticker', {
      characterForm: 'stickman',
      textMode: 'auto',
      theme: 'controlled-accessories',
    });

    expect(prompt).toContain('Selected design theme: controlled-accessories');
    expect(prompt).toContain('Use exactly 2-4 accessories per variation');
    expect(prompt).toContain('Never mix different themes within one prompt');
  });

  it('requires structured sticker prompts that name the core visual decisions', () => {
    const prompt = buildSystemPrompt('dalle', 'sticker', {
      characterForm: 'animal',
      textMode: 'none',
      theme: 'simple-cute',
    });

    expect(prompt).toContain('Sticker design prompt:');
    expect(prompt).toContain('Character form:');
    expect(prompt).toContain('Main character:');
    expect(prompt).toContain('Text in design:');
    expect(prompt).toContain('Theme:');
    expect(prompt).toContain('Expression:');
    expect(prompt).toContain('Pose/action:');
    expect(prompt).toContain('Composition:');
    expect(prompt).toContain('Sticker details:');
    expect(prompt).toContain('Avoid:');
  });

  it('requires sticker prompts to keep the complete subject visible and uncropped', () => {
    const prompt = buildSystemPrompt('stable-diffusion', 'sticker', {
      characterForm: 'animal',
      textMode: 'none',
      theme: 'simple-cute',
    });

    expect(prompt).toContain('full body complete character visible');
    expect(prompt).toContain('head-to-toe');
    expect(prompt).toContain('safe margins');
    expect(prompt).toContain('no close-up');
    expect(prompt).toContain('no cropped head');
    expect(prompt).toContain('no cut off body');
    expect(prompt).not.toContain('full body or bust');
  });

  it('requires regenerated sticker prompts to keep the same structured fields', () => {
    const prompt = buildRegeneratePrompt(
      {
        name: 'Sleepy Bean Cat',
        description: 'A sleepy orange cat mascot holding coffee.',
        colors: ['#f97316', '#ffffff', '#111827'],
        style: 'simple cute vector sticker',
        characterType: 'animal',
      },
      'happy',
      'dalle',
      'sticker',
      {
        characterForm: 'animal',
        textMode: 'none',
        theme: 'simple-cute',
      }
    );

    expect(prompt).toContain('Sticker design prompt:');
    expect(prompt).toContain('Character form:');
    expect(prompt).toContain('Text in design:');
    expect(prompt).toContain('Expression:');
    expect(prompt).toContain('Avoid:');
  });
});
