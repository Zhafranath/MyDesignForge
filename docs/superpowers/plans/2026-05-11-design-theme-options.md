# Design Theme Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-choice design theme selector and carry it through UI, random ideas, API validation, and prompt generation.

**Architecture:** Extend the existing `GenerationOptions` contract with `theme`, centralize theme metadata in `src/lib/constants.ts`, and reuse existing selector patterns in a new `ThemeSelector` component. Prompt builders and random ideas consume the same option so user selections stay consistent.

**Tech Stack:** Next.js 15 app router, React 18, TypeScript, Vitest, Testing Library.

---

### Task 1: Theme Contract and Tests

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/__tests__/prompts.test.ts`
- Modify: `src/lib/__tests__/randomIdeas.test.ts`
- Modify: `src/app/api/generate/route.test.ts`

- [ ] Add failing tests for selected theme prompt guidance, random idea hints, and API validation.
- [ ] Add `DesignTheme`, theme constants, and `theme` default.
- [ ] Update prompt builder and random idea code until tests pass.

### Task 2: Theme Selector UI

**Files:**
- Create: `src/components/ThemeSelector.tsx`
- Modify: `src/components/__tests__/GenerationOptionsSelectors.test.tsx`
- Modify: `src/app/page.tsx`

- [ ] Add failing selector test for selecting `Full acc terkontrol`.
- [ ] Create `ThemeSelector` using the same radio-button style as existing selectors.
- [ ] Wire `theme` state from `generationOptions` in `HomePage`.

### Task 3: Verification

**Commands:**
- `npm run test`
- `npm run type-check`
- `npm run build`

- [ ] Confirm all tests pass.
- [ ] Confirm type-check passes.
- [ ] Confirm production build passes.
