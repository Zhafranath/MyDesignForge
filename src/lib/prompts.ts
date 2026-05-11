import type { CharacterForm, DesignTheme, GenerationOptions, Platform, Expression, ProductType } from '@/types';
import { CHARACTER_FORM_OPTIONS, DEFAULT_GENERATION_OPTIONS, DESIGN_THEME_OPTIONS, EXPRESSION_ORDER, PRODUCTS } from './constants';

const PLATFORM_STYLES: Record<Platform, string> = {
  midjourney: `
- Use Midjourney v6 syntax with vivid comma-separated phrases.
- Use double-colon weights for key elements, e.g. "original mascot::2, clean silhouette::1.4".
- Add a product-appropriate aspect ratio: sticker --ar 1:1, phone case --ar 9:16, t-shirt --ar 4:5.
- Append at end: --style raw --q 2 --no mockup, watermark, logo, copyrighted character, celebrity, blurry text, extra limbs`.trim(),

  dalle: `
- Use DALL-E natural language style: full descriptive sentences, not only tags.
- Be explicit about composition, clean edges, colors, background, and print-readiness.
- Mention that the artwork is a standalone illustration, not a product mockup.
- Avoid requesting imitations of famous characters, brands, shows, artists, or celebrities.`.trim(),

  'stable-diffusion': `
- Use SDXL tag-style syntax separated by commas.
- Include quality boosters: (clean vector illustration:1.25), (crisp lineart:1.2), high resolution, sharp edges.
- Include product-specific composition tags and clear subject isolation.
- End with a negative prompt in brackets: [lowres, blurry, watermark, logo, text artifacts, copyrighted character, celebrity likeness, bad anatomy, extra limbs, mockup]`.trim(),

  kling: `
- Kling AI style: concise natural description with strong visual staging.
- Focus on a static hero frame that could also become a subtle loop: tiny bounce, sparkle drift, gentle wiggle.
- Keep it centered and product-ready; do not describe a product mockup.
- 50-90 words max.`.trim(),

  runway: `
- Runway prompt style: describe the static frame first, then optional motion cue in parentheses.
- Example: "An original chibi frog mascot... (subtle idle bounce, sparkles drift)".
- Emphasize clear silhouette, centered subject, clean vector-like finish.
- Avoid product mockups, brand names, copyrighted characters, and celebrity likenesses.`.trim(),
};

const PRODUCT_GUIDES: Record<ProductType, string> = {
  sticker: `
TARGET: Redbubble sticker / sticker pack.
- Square 1:1 composition, isolated single subject or compact sticker pack arrangement.
- Transparent background, crisp outer contour, thick white kiss-cut border, no stray pixels.
- Big readable shape at small size; avoid tiny details and long text.
- Prompt should say: "transparent background, sticker-ready, die-cut outline, thick white border".
- Do not show a physical sticker sheet mockup unless the user explicitly asks.`.trim(),

  'phone-case': `
TARGET: Redbubble phone case.
- Vertical portrait composition, preferably 9:16, full-bleed artwork or repeating pattern.
- Keep important details away from edges and top camera area; allow safe negative space near the upper corners.
- Use bold shapes, repeated motifs, or a central mascot that still reads on a narrow phone case.
- Prompt should say: "vertical phone case artwork, full-bleed composition, safe margins, no phone mockup".
- Avoid small text and details that would be hidden by camera cutouts.`.trim(),

  't-shirt': `
TARGET: Redbubble apparel / t-shirt graphic.
- Portrait 4:5 or tall centered chest graphic, transparent background, no square background box.
- Strong silhouette, readable from a distance, limited but memorable palette.
- Works on light and dark shirts; use clean line art and optional short original phrase only.
- Prompt should say: "transparent background, centered t-shirt graphic, print-ready, no shirt mockup".
- Avoid realistic fabric/product photos; generate the artwork only.`.trim(),
};

const VARIATION_GUIDE: Record<Expression, string> = {
  happy: 'joyful friendly mascot with open arms or jumping pose, bright scene, upbeat background',
  cry: 'dramatic cute emotion with teary eyes and soft lighting, rainy window or sad story element',
  sleepy: 'cozy relaxed composition, curled-up or yawning pose, warm blanket or bedroom setting',
  hype: 'high-energy motion, dynamic jump or dance pose, flashy background and bold lines',
  blush: 'maximum cuteness with shy gesture, turned head or hand-to-face pose, pastel setting',
  angry: 'sassy spicy attitude with clenched fists or stomping pose, stormy or graphic background',
  poker: 'deadpan absurd humor with flat pose, minimalist background, funny sign or prop',
  love: 'heartwarming affectionate mood with hugging or gift-giving pose, warm cozy details',
  panic: 'chaotic comedy with surprised leap or spill, action lines and cluttered scene',
};

function buildCharacterFormGuide(characterForm: CharacterForm): string {
  if (characterForm === 'auto') {
    return `Selected character form: auto
- Choose the strongest original form for the user's idea.
- The concept characterType must clearly name the chosen form, such as cartoon animal, living object, stickman, fantasy creature, robot, living food, living plant, cute monster, or original mascot.`;
  }

  const form = CHARACTER_FORM_OPTIONS[characterForm];
  return `Selected character form: ${characterForm}
- The concept characterType must match this selected form: ${form.label}.
- Every prompt string must explicitly mention ${form.label} so downstream image tools preserve the chosen form.
- Every design prompt must keep the same selected form and not drift into another character category.
- If the user's idea conflicts with this selected form, adapt the idea into a brand-safe original ${form.label.toLowerCase()} character.`;
}

function buildTextGuide(options: GenerationOptions): string {
  if (options.textMode === 'auto') {
    return `Text mode: automatic expression text
- Include one short original phrase of 1-5 words in every design prompt.
- The phrase should match each expression, for example hello for happy, boo for panic, sorry for cry, nope for poker, or love you for love.
- Each prompt string must explicitly include the visible phrase in quotes, for example text reading "hello".
- Keep text simple, readable, original, and not trademarked.`;
  }

  if (options.textMode === 'custom') {
    const customText = options.customText?.trim() ?? '';
    return `Text mode: custom text
- Use this exact text: "${customText}" in every design prompt.
- Do not translate, paraphrase, or change the spelling.
- Keep the text readable, short, and integrated as lettering, a tiny sign, or a speech bubble only when it fits the product composition.`;
  }

  return `Text mode: no text
- Do not include readable text in any design prompt.
- Use no lettering, no typography, no captions, no speech bubbles, no quote text, and no readable words.
- Visual expression must come from pose, face, props, action lines, and composition.`;
}

function buildThemeGuide(theme: DesignTheme): string {
  if (theme === 'auto') {
    return `Selected design theme: auto
- Choose the strongest visual theme for the user's idea and selected product.
- Keep the theme consistent across the concept and all 9 design prompts.`;
  }

  if (theme === 'minimalist') {
    return `Selected design theme: minimalist
- Use a clean minimal composition with very few props, accessories, background details, or tiny decorative elements.
- Keep the character readable with strong silhouette, simple shapes, and generous negative space.`;
  }

  if (theme === 'controlled-accessories') {
    return `Selected design theme: controlled-accessories
- Use only 2-4 relevant accessories or props per prompt.
- Choose accessories that support the expression or mini-story; do not use every possible accessory.
- Keep the design readable, balanced, and not cluttered.`;
  }

  const themeOption = DESIGN_THEME_OPTIONS[theme];
  return `Selected design theme: ${theme}
- Use the ${themeOption.label} direction consistently across the concept and all 9 design prompts.
- Every prompt should clearly reflect this theme while preserving product readability and commercial print quality.
- Avoid adding unrelated styles that conflict with ${themeOption.label}.`;
}

export function buildSystemPrompt(
  platform: Platform,
  targetProduct: ProductType = 'sticker',
  options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
): string {
  const expressions = EXPRESSION_ORDER.join(', ');
  const platformGuide = PLATFORM_STYLES[platform];
  const productGuide = PRODUCT_GUIDES[targetProduct];
  const product = PRODUCTS[targetProduct];
  const characterFormGuide = buildCharacterFormGuide(options.characterForm);
  const textGuide = buildTextGuide(options);
  const themeGuide = buildThemeGuide(options.theme);

  return `You are StickerForge AI — an expert prompt engineer for original, cute, sellable print-on-demand artwork inspired by Redbubble marketplace needs.

Your task: Given a design idea in any language, create ONE original character/design concept and generate 9 varied image prompts for the selected product.

TARGET PRODUCT: ${product.emoji} ${product.label}
${productGuide}

## CHARACTER FORM OPTION
${characterFormGuide}

## TEXT OPTION
${textGuide}

## DESIGN THEME OPTION
${themeGuide}

## OUTPUT FORMAT — CRITICAL
You MUST output exactly 10 lines of valid JSON (NDJSON), one minified JSON object per line.
- Line 1: The concept object.
- Lines 2-10: One design prompt per variation, in this exact expression order: ${expressions}.
DO NOT output markdown, explanations, numbering, code fences, or extra text.

## LINE 1 — Concept object
{
  "type": "concept",
  "name": "Original English character/design name, not trademarked",
  "tagline": "A short catchy tagline, max 8 words",
  "characterType": "One short category describing the character form, e.g. animal, human, cartoon, doodle, anime, object, stickman, fantasy creature",
  "description": "2-3 sentences describing the character/design personality, visual hook, and buyer appeal",
  "colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4"],
  "style": "Brief style descriptor, e.g. 'bold kawaii vector mascot with chunky outlines'",
  "productFit": "One short sentence in Bahasa Indonesia explaining why this works for ${product.label}",
  "tags": ["8-12 searchable English tags, lowercase, no trademarks"]
}

## LINES 2-10 — Design prompt objects
{
  "type": "design",
  "expression": "one of: ${expressions}",
  "title": "Short English title for this variation",
  "emoji": "single representative emoji",
  "prompt": "THE ACTUAL IMAGE PROMPT IN ENGLISH — ready to paste into the selected AI tool",
  "tips": "Short tip in Bahasa Indonesia, max 14 words, about using or tweaking this prompt"
}

## ORIGINALITY AND SELLER-SAFETY RULES
- Create original characters only. Do NOT reference or imitate existing brands, logos, celebrities, movies, anime, games, memes, artists, or named fictional characters.
- If the user asks for a famous character or brand, transform it into a legally safer original archetype with different name, colors, silhouette, costume, and setting.
- Avoid public figure likeness, copyrighted characters, trademarked words, team logos, brand names, and fan-art mashups.
- No watermarks, no signatures, no QR codes, no product mockups, no screenshots, no UI elements.
- **MANDATORY: Follow the TEXT OPTION section EXACTLY for whether text may appear in every prompt. Do not deviate.**
- **MANDATORY: Follow the CHARACTER FORM OPTION section EXACTLY. The selected form MUST appear in the concept and ALL 9 design prompts. No substitutions, drifts, or variations.**
- **MANDATORY: Follow the DESIGN THEME OPTION section EXACTLY. Keep the selected theme consistent and do not overfill the artwork.**
- Decide the character form clearly for the concept according to the CHARACTER FORM OPTION section.
- If two forms overlap, choose a single broad label such as "cartoon animal", "fantasy mascot", or "doodle creature".

## MARKETABLE DESIGN RULES
- Prioritize cute, funny, relatable, and giftable ideas with a clear visual hook.
- The idea must NOT feel like a fixed template. Vary species, object-creatures, stickman concepts, original mascots, poses, props, and mini-stories.
- Strong silhouette, clean line art, print-friendly contrast, and uncluttered composition.
- Make the design readable at thumbnail size.
- Use meaningful variation across pose, action, background/setting, position/perspective, prop, or pattern.
- Colors from the concept palette must appear in every prompt.
- **CRITICAL: ALL 9 prompts must use EXACTLY the same character form. Do NOT change, drift, or substitute the form.** If form is stickman, all 9 must be stickman. If form is cartoon animal, all 9 must stay cartoon animal.
- Each of the 9 prompts must be meaningfully different in pose, composition, prop, joke, background, or pattern while keeping the same character identity AND form.

## VARIATION GUIDE
${EXPRESSION_ORDER.map((expr) => `- ${expr}: ${VARIATION_GUIDE[expr]}`).join('\n')}

## PLATFORM-SPECIFIC PROMPT STYLE
${platformGuide}

Generate prompts that are highly usable as AI image prompts, product-specific for ${product.label}, original enough for commercial use, and cute enough to become a Redbubble reference design. Keep every JSON object valid. Do not include trailing commas.`;
}

export function buildRegeneratePrompt(
  concept: { name: string; description: string; colors: string[]; style: string; productFit?: string; tags?: string[]; characterType?: string },
  expression: Expression,
  platform: Platform,
  targetProduct: ProductType = 'sticker',
  options: GenerationOptions = DEFAULT_GENERATION_OPTIONS
): string {
  const platformGuide = PLATFORM_STYLES[platform];
  const productGuide = PRODUCT_GUIDES[targetProduct];
  const product = PRODUCTS[targetProduct];
  const characterFormGuide = buildCharacterFormGuide(options.characterForm);
  const textGuide = buildTextGuide(options);
  const themeGuide = buildThemeGuide(options.theme);

  return `You are StickerForge AI. Regenerate ONE product-specific image prompt for an existing original character/design.

TARGET PRODUCT: ${product.emoji} ${product.label}
${productGuide}

CHARACTER FORM (LOCKED — DO NOT CHANGE):
${characterFormGuide}

TEXT OPTION (LOCKED — DO NOT CHANGE):
${textGuide}

DESIGN THEME (LOCKED — DO NOT CHANGE):
${themeGuide}

LOCKED CONCEPT — DO NOT CHANGE IDENTITY:
- Name: ${concept.name}
- Description: ${concept.description}
${concept.characterType ? `- Character type: ${concept.characterType}
` : ''}- Colors: ${concept.colors.join(', ')}
- Style: ${concept.style}
- Product fit: ${concept.productFit ?? 'Keep it product-ready.'}
- Tags: ${(concept.tags ?? []).join(', ')}

TASK: Generate a NEW, DIFFERENT prompt for variation/expression: "${expression}".
Variation angle: ${VARIATION_GUIDE[expression]}

OUTPUT: Exactly 1 line of valid minified JSON:
{"type":"design","expression":"${expression}","title":"[short English title]","emoji":"[emoji]","prompt":"[English image prompt]","tips":"[tip in Bahasa Indonesia]"}

ORIGINALITY RULES:
- No brands, logos, celebrities, copyrighted characters, fan art, watermarks, mockups, screenshots, or QR codes.
- Keep the same character identity, palette, and style, but change composition, prop, pose, or micro-story.
- **MANDATORY: Keep EXACTLY the same character form. Do not change or drift from the locked form.**
- **MANDATORY: Follow the TEXT OPTION exactly. If text is locked to 'none', no text at all. If 'auto', include matching short phrase. If 'custom', use exact phrase.**
- **MANDATORY: Follow the DESIGN THEME exactly. Do not switch visual density or style.**

PLATFORM STYLE:
${platformGuide}

Return only the JSON line. No markdown. No extra text.`;
}
