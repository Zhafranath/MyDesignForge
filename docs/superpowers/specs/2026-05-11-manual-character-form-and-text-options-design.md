# Manual Character Form and Text Options Design

Date: 2026-05-11

## Goal

Add manual controls so users can guide generated Redbubble prompt packs by choosing the character form and whether generated designs include expressive text.

## User Controls

Add two controls near the existing idea input and product/platform selectors:

1. Character form selector
   - Options: AI pilih, Hewan, Manusia, Cartoon, Doodle, Anime, Benda hidup, Stickman, Makhluk fantasi, Robot, Makanan hidup, Tanaman hidup, Monster lucu, Maskot original.
   - Default: AI pilih.
   - The selected value should guide the concept's `characterType` and every generated image prompt.

2. Text option selector
   - Options: Tanpa tulisan, Tulisan otomatis sesuai ekspresi, Tulisan custom.
   - Default: Tanpa tulisan.
   - If `Tanpa tulisan`, every prompt must explicitly avoid lettering, readable text, captions, typography, and speech bubbles.
   - If `Tulisan otomatis sesuai ekspresi`, every generated prompt should include a short original phrase of 1-5 words that matches its expression, such as "hello", "boo", or "sorry", without using trademarks or copyrighted quotes.
   - If `Tulisan custom`, show a short text input where the user can enter a phrase. Every generated prompt should include that exact phrase with no alternate spelling, while keeping it visually readable.

## Data Model

Add request-level options:

- `characterForm?: string`
- `textMode: 'none' | 'auto' | 'custom'`
- `customText?: string`

Keep `CharacterConcept.characterType` as the generated display field. It should reflect the selected form, or AI's chosen form when the selector is set to AI pilih.

## Prompt Behavior

`buildSystemPrompt` should accept the new options and include a dedicated guide:

- Lock the concept form when a specific character form is selected.
- Allow AI to choose only when `AI pilih` is selected.
- For text mode `none`, add a strict no-text rule.
- For text mode `auto`, request one short expression-matching phrase per variation.
- For text mode `custom`, request the exact user phrase in every variation and no alternate spelling.

`buildRegeneratePrompt` should receive the same text settings and preserve the existing concept's character form.

## API Behavior

Validate incoming generate and regenerate requests:

- Accept only known `characterForm` values.
- Accept only known `textMode` values.
- Require non-empty `customText` only when `textMode` is `custom`.
- Limit `customText` to 30 characters and recommend 1-5 words so it remains practical for sticker, phone case, and t-shirt artwork.

## UI Behavior

The main page owns these new state values and passes them to `generate` and `regenerateOne`.

Show the custom text input only when `Tulisan custom` is selected. Use concise Indonesian labels, for example:

- `Bentuk karakter`
- `Tulisan di desain`
- `Teks custom`

## Output Display

The existing concept card should continue showing `characterType`.

Copy-all and export output should include the character type so the user's chosen form is preserved outside the app.

## Testing

Add tests before implementation:

1. Prompt builder includes the selected character form and relevant text rules.
2. Prompt builder forbids text in `none` mode.
3. Prompt builder includes exact custom text in `custom` mode.
4. API validation rejects invalid character form, invalid text mode, and missing custom text for custom mode.
5. Existing generate request behavior still works with defaults.

## Constraints

Do not change the core output shape from 10 NDJSON lines. Keep prompts commercially safe by continuing to avoid brands, public figures, copyrighted characters, fan art, mockups, watermarks, and QR codes.
