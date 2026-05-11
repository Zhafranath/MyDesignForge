# Manual Character Form and Text Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual character-form selection and text/no-text/custom-text controls to StickerForge generation.

**Architecture:** Centralize option metadata in `src/lib/constants.ts`, expose typed option values in `src/types/index.ts`, pass selected options from `src/app/page.tsx` through `useGenerate` into `/api/generate`, and apply the options inside `src/lib/prompts.ts`. Add small focused UI components for the new controls, matching existing selector patterns.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind CSS, Vitest.

---

### Task 1: Prompt Builder Tests

**Files:**
- Create: `src/lib/__tests__/prompts.test.ts`
- Modify later: `src/lib/prompts.ts`

- [ ] **Step 1: Write failing prompt tests**

Create `src/lib/__tests__/prompts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from '../prompts';

describe('buildSystemPrompt generation options', () => {
  it('locks a selected character form into the concept and prompts', () => {
    const prompt = buildSystemPrompt('midjourney', 'sticker', {
      characterForm: 'animal',
      textMode: 'none',
    });

    expect(prompt).toContain('Selected character form: animal');
    expect(prompt).toContain('The concept characterType must match this selected form');
  });

  it('forbids text when textMode is none', () => {
    const prompt = buildSystemPrompt('dalle', 'sticker', {
      characterForm: 'auto',
      textMode: 'none',
    });

    expect(prompt).toContain('Do not include readable text');
    expect(prompt).toContain('no lettering, no typography, no captions, no speech bubbles');
  });

  it('requests expression-matching text when textMode is auto', () => {
    const prompt = buildSystemPrompt('stable-diffusion', 't-shirt', {
      characterForm: 'stickman',
      textMode: 'auto',
    });

    expect(prompt).toContain('Include one short original phrase');
    expect(prompt).toContain('match each expression');
  });

  it('uses exact custom text when textMode is custom', () => {
    const prompt = buildSystemPrompt('runway', 'phone-case', {
      characterForm: 'fantasy-creature',
      textMode: 'custom',
      customText: 'boo!',
    });

    expect(prompt).toContain('Use this exact text: "boo!"');
    expect(prompt).toContain('Do not translate, paraphrase, or change the spelling');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/__tests__/prompts.test.ts`

Expected: FAIL because `buildSystemPrompt` does not accept the new options and does not include the new rules.

### Task 2: Types and Constants

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add typed option values**

Add to `src/types/index.ts`:

```ts
export type CharacterForm =
  | 'auto'
  | 'animal'
  | 'human'
  | 'cartoon'
  | 'doodle'
  | 'anime'
  | 'living-object'
  | 'stickman'
  | 'fantasy-creature'
  | 'robot'
  | 'living-food'
  | 'living-plant'
  | 'cute-monster'
  | 'original-mascot';

export type TextMode = 'none' | 'auto' | 'custom';

export interface GenerationOptions {
  characterForm: CharacterForm;
  textMode: TextMode;
  customText?: string;
}
```

- [ ] **Step 2: Add UI metadata and defaults**

Add to `src/lib/constants.ts`:

```ts
export const CHARACTER_FORM_OPTIONS: Record<CharacterForm, { label: string; description: string }> = { ... };
export const CHARACTER_FORM_ORDER: CharacterForm[] = [ ... ];
export const TEXT_MODE_OPTIONS: Record<TextMode, { label: string; description: string }> = { ... };
export const TEXT_MODE_ORDER: TextMode[] = ['none', 'auto', 'custom'];
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  characterForm: 'auto',
  textMode: 'none',
  customText: '',
};
export const MAX_CUSTOM_TEXT_LENGTH = 30;
```

- [ ] **Step 3: Run type check for introduced type mistakes**

Run: `npm run type-check`

Expected: Type errors may remain until prompt/API/UI tasks are complete, but type imports should resolve.

### Task 3: Prompt Builder Implementation

**Files:**
- Modify: `src/lib/prompts.ts`
- Test: `src/lib/__tests__/prompts.test.ts`

- [ ] **Step 1: Update prompt function signatures**

Use:

```ts
export function buildSystemPrompt(
  platform: Platform,
  targetProduct: ProductType = 'sticker',
  options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
): string
```

And:

```ts
export function buildRegeneratePrompt(
  concept: { ... },
  expression: Expression,
  platform: Platform,
  targetProduct: ProductType = 'sticker',
  options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
): string
```

- [ ] **Step 2: Add generation option guides**

Add helpers:

```ts
function buildCharacterFormGuide(characterForm: CharacterForm): string { ... }
function buildTextGuide(options: GenerationOptions): string { ... }
```

Use these guides in both system and regenerate prompts.

- [ ] **Step 3: Run prompt tests to verify green**

Run: `npm run test -- src/lib/__tests__/prompts.test.ts`

Expected: PASS.

### Task 4: API Validation Tests and Implementation

**Files:**
- Modify: `src/app/api/generate/route.test.ts`
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Add failing API validation tests**

Add tests that POST invalid values and expect HTTP 400:

```ts
it('rejects invalid character form', async () => { ... });
it('rejects invalid text mode', async () => { ... });
it('requires custom text for custom text mode', async () => { ... });
it('accepts generation options with default-compatible request body', async () => { ... });
```

- [ ] **Step 2: Run route tests to verify failures**

Run: `npm run test -- src/app/api/generate/route.test.ts`

Expected: FAIL for new validation expectations.

- [ ] **Step 3: Add validation and pass options into prompt builders**

Update `GenerateBody` and `validateBody` to normalize:

```ts
const generationOptions: GenerationOptions = {
  characterForm: (b.characterForm as CharacterForm | undefined) ?? 'auto',
  textMode: (b.textMode as TextMode | undefined) ?? 'none',
  customText: typeof b.customText === 'string' ? b.customText.trim() : '',
};
```

Reject invalid option values and missing/too-long custom text.

- [ ] **Step 4: Run route tests to verify green**

Run: `npm run test -- src/app/api/generate/route.test.ts`

Expected: PASS.

### Task 5: Hook and UI Controls

**Files:**
- Create: `src/components/CharacterFormSelector.tsx`
- Create: `src/components/TextOptionsSelector.tsx`
- Modify: `src/hooks/useGenerate.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update hook signatures**

Change:

```ts
generate(description, platform, targetProduct, generationOptions)
regenerateOne(expression, concept, platform, targetProduct, generationOptions)
```

Include `characterForm`, `textMode`, and `customText` in both fetch bodies.

- [ ] **Step 2: Add selectors**

Create selector components matching `ProductSelector`/`PlatformSelector`, using `role="radiogroup"` for options and a regular input for custom text.

- [ ] **Step 3: Wire state in the page**

Add state:

```ts
const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
```

Pass options into `generate` and `regenerateOne`.

### Task 6: Copy and Export Output

**Files:**
- Modify: `src/components/StickerGrid.tsx`
- Modify: `src/components/ExportButton.tsx`

- [ ] **Step 1: Include character type in copy-all**

Add:

```ts
concept.characterType ? `Character type: ${concept.characterType}` : ''
```

- [ ] **Step 2: Include character type in `.txt` export**

Add:

```ts
pack.concept.characterType ? `Character   : ${pack.concept.characterType}` : ''
```

### Task 7: Full Verification

**Files:**
- All modified files

- [ ] **Step 1: Run unit tests**

Run: `npm run test`

Expected: all Vitest suites pass.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`

Expected: exit code 0.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: exit code 0.

---

## Self-Review

Spec coverage: character form selector, text mode selector, custom text, API validation, prompt behavior, copy/export output, and tests are covered.

Placeholder scan: No task relies on unspecified behavior; code snippets indicate the concrete interfaces and assertions.

Type consistency: The plan consistently uses `CharacterForm`, `TextMode`, `GenerationOptions`, `characterForm`, `textMode`, and `customText`.
