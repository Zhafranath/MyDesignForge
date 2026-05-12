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

// ─────────────────────────────────────────────────────────────────
// VARIATION GUIDES
// ─────────────────────────────────────────────────────────────────

// Used by ALL themes except controlled-accessories.
// Expression comes from face, eyes, and body pose. Props kept to 0-1 max.
const VARIATION_GUIDE: Record<Expression, string> = {
  happy:  'joyful friendly pose with open arms or jumping, bright cheerful background, expression-driven energy — no accessories',
  cry:    'dramatic cute sad face, teary eyes, soft composition — one small prop like a tiny teardrop or tissue at most',
  sleepy: 'cozy relaxed pose, curled-up or yawning — one minimal prop like a small pillow or blanket only',
  hype:   'high-energy dynamic jump or dance pose, bold action lines — no accessories, expression from strong body gesture',
  blush:  'maximum cuteness with shy gesture, hand-to-face or turned head, pastel clean setting — no props needed',
  angry:  'sassy spicy attitude with clenched fists or stomping pose, expressive face — no accessories, stormy simple background',
  poker:  'deadpan flat pose, absurd dry expression, simple background — one tiny funny prop at most',
  love:   'heartwarming affectionate mood with hugging gesture or small heart prop, warm cozy tone, clean composition',
  panic:  'chaotic comedy with surprised leap or spill, action lines, exaggerated face — minimal clutter, expression-forward',
};

// Used ONLY by controlled-accessories theme.
// Each expression = one distinct costume/role with exactly 2-4 matching thematic accessories.
// Reference: capybara sticker pack (beach tourist, chef, cinema, scooter, pilot, traveler, sleepy, bookworm, halloween).
const CONTROLLED_ACCESSORIES_VARIATION_GUIDE: Record<Expression, { role: string; accessories: string }> = {
  happy:  { role: 'beach / tropical tourist',   accessories: 'sunglasses + tropical drink + small palm tree prop — all beach-themed' },
  cry:    { role: 'halloween witch / spooky',    accessories: 'pointy witch hat + carved pumpkin + small star wand — all halloween-themed' },
  sleepy: { role: 'cozy bedtime',                accessories: 'soft sleeping cap + small pillow + cozy blanket — all sleep-themed' },
  hype:   { role: 'scooter rider / urban',       accessories: 'riding helmet + aviator scarf + small scooter prop — all rider-themed' },
  blush:  { role: 'chef / baker',                accessories: 'white chef hat + small apron + wooden spoon — all cooking-themed' },
  angry:  { role: 'aviator / pilot',             accessories: 'pilot goggles + aviator jacket + small wing or dashboard prop — all pilot-themed' },
  poker:  { role: 'cinema-goer / movie fan',     accessories: '3D glasses + striped popcorn box + small film ticket — all movie-themed' },
  love:   { role: 'explorer / traveler',         accessories: 'wide-brim explorer hat + small backpack + tiny map or camera — all travel-themed' },
  panic:  { role: 'bookworm / student',          accessories: 'open book + reading glasses + cozy armchair or desk lamp — all reading-themed' },
};

// ─────────────────────────────────────────────────────────────────
// BUILDER HELPERS
// ─────────────────────────────────────────────────────────────────

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
- Keep the theme consistent across the concept and all 9 design prompts.
- Default to a clean, character-focused style — expression comes from face and pose, NOT from accessories.
- Keep props to 0-1 per variation unless the idea clearly calls for more.`;
  }

  if (theme === 'minimalist') {
    return `Selected design theme: minimalist
- Extremely clean composition: the character alone on a plain or near-plain background.
- ZERO accessories or props. Expression must come entirely from face, eyes, and body pose.
- Generous negative space. Thick clean outline. Simple flat colors.
- Do NOT add hats, bags, tools, costumes, or any decorative items whatsoever.
- Every prompt must include: "minimalist composition, no accessories, clean background, expression-driven pose, simple flat colors".`;
  }

  if (theme === 'simple-cute') {
    return `Selected design theme: simple-cute
- Clean kawaii sticker-pack style. Character is the full focus.
- Allow at most ONE small relevant prop that directly supports the expression (e.g. a tiny teardrop for cry, a tiny heart for love, a tiny zzz cloud for sleepy).
- Do NOT add costumes, hats, bags, or thematic accessories beyond that single prop.
- Soft plain or lightly textured background. Thick rounded outline, round shapes, soft flat colors.
- Expression comes primarily from face and pose — NOT from accessories.
- Every prompt must include: "simple cute kawaii style, clean outline, minimal props, character-focused, white or soft background".`;
  }

  if (theme === 'controlled-accessories') {
    return `Selected design theme: controlled-accessories (themed costume collection)
- EACH of the 9 variations represents ONE distinct themed costume/role for the character.
- A themed role means: chef, pilot, beach tourist, halloween witch, etc. — a complete mini costume identity.
- ALL accessories in a single variation MUST belong to the SAME theme (e.g. if chef: only chef hat + apron + spoon — nothing else).
- Use exactly 2-4 accessories per variation, all thematically consistent. Never mix different themes within one prompt.
- Use a flat or lightly solid-colored background that complements the costume theme (not plain white).
- The character's body expression should match both the variation's emotion AND the costume role.
- Each of the 9 variations must use a DIFFERENT themed role — full set reads as a diverse costume sticker collection.
- Follow the CONTROLLED-ACCESSORIES VARIATION GUIDE below for the assigned role and exact accessories per expression.
- Every prompt must include: "themed costume sticker, flat colored background, clean vector style, [role name] costume, 2-4 matching thematic accessories only, no extra props outside the theme".`;
  }

  if (theme === 'kawaii-pastel') {
    return `Selected design theme: kawaii-pastel
- Soft pastel color palette throughout: lavender, mint, peach, baby pink, sky blue.
- Rounded cute shapes. Sparkles or tiny hearts as minimal decorative accents only (0-1 accent element).
- Allow 0-1 small cute prop (e.g. a tiny flower, a small star, a small cloud). No costumes or heavy accessories.
- Expression driven primarily by face and pose.
- Every prompt must include: "kawaii pastel style, soft rounded shapes, pastel color palette, 0-1 minimal prop, expression-driven".`;
  }

  if (theme === 'bold-vector') {
    return `Selected design theme: bold-vector
- Very thick outlines, strong contrasting flat colors, simple geometric shapes.
- Clean flat fill, no gradients. Strong silhouette that reads at a distance.
- 0-1 simple prop only if it directly adds to the expression. No accessory clutter.
- Every prompt must include: "bold vector style, thick black outline, flat color fill, high contrast, print-ready, 0-1 prop maximum".`;
  }

  if (theme === 'retro-90s') {
    return `Selected design theme: retro-90s
- 90s nostalgia visual: bold chunky outlines, limited retro palette (teal, orange, yellow, purple), simple shapes.
- Allow 1-2 retro-themed props that feel authentically 90s (e.g. cassette tape, star burst, retro sunglasses, pixel icon).
- Do not overfill. Keep composition tight and nostalgic.
- Every prompt must include: "retro 90s sticker style, chunky outline, nostalgic color palette, 1-2 retro props only".`;
  }

  if (theme === 'streetwear') {
    return `Selected design theme: streetwear
- Urban casual aesthetic. Items like hoodies, snapback caps, sneakers, or graphic tees define the visual language.
- Allow 2-3 streetwear-specific items MAX. Keep it cool and clean, never overcrowded.
- Strong pose and attitude. Flat urban background or simple gradient backdrop.
- Every prompt must include: "streetwear style, urban casual, clean graphic, 2-3 streetwear elements only, no extra props".`;
  }

  if (theme === 'goth-cute') {
    return `Selected design theme: goth-cute
- Primarily cute character with 1-2 light gothic accent props (e.g. tiny bat wings, moon motif, dark flower, small skull ribbon).
- Soft contrast: pale or pastel base with dark accents. Do NOT overload with dark elements — keep it 80% cute.
- Expression driven by face and pose first; gothic accents are decorative only.
- Every prompt must include: "goth cute style, soft contrast, 1-2 gothic accents only, primarily cute expression, pale background".`;
  }

  if (theme === 'decorative-pattern') {
    return `Selected design theme: decorative-pattern
- Repeating motif or surface pattern featuring the character or character-derived elements.
- For stickers/apparel: tight repeating arrangement of small character icons, expression faces, or related small icons.
- Keep individual icons simple and clear. Avoid complex single-character scenes.
- Every prompt must include: "decorative repeat pattern, small icon arrangement, clean surface pattern, print-ready, seamless tiling".`;
  }

  if (theme === 'premium-mascot') {
    return `Selected design theme: premium-mascot
- Polished commercial mascot quality: smooth shading, subtle gradients, professional clean finish.
- Allow 1-3 brand-appropriate props that clearly define the mascot's personality — no more.
- Strong centered pose, confident expression, clean composition suitable for brand use.
- Every prompt must include: "premium mascot illustration, professional quality, subtle shading, brand-safe, 1-3 defining props only".`;
  }

  const themeOption = DESIGN_THEME_OPTIONS[theme as DesignTheme];
  return `Selected design theme: ${theme}
- Use the ${themeOption.label} direction consistently across the concept and all 9 design prompts.
- Keep accessory count minimal: 0-2 props only, relevant to the expression.
- Every prompt should clearly reflect this theme while preserving product readability and commercial print quality.
- Avoid adding unrelated styles or excessive accessories that conflict with ${themeOption.label}.`;
}

function buildVariationGuideSection(theme: DesignTheme): string {
  if (theme === 'controlled-accessories') {
    return `## CONTROLLED-ACCESSORIES VARIATION GUIDE — FOLLOW EXACTLY
Each expression below has a fixed themed role and fixed accessories. Do NOT deviate:
${EXPRESSION_ORDER.map((expr) => {
  const g = CONTROLLED_ACCESSORIES_VARIATION_GUIDE[expr];
  return `- ${expr}: Role = "${g.role}" | Accessories = ${g.accessories}`;
}).join('\n')}`;
  }

  return `## VARIATION GUIDE
${EXPRESSION_ORDER.map((expr) => `- ${expr}: ${VARIATION_GUIDE[expr]}`).join('\n')}`;
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORTS
// ─────────────────────────────────────────────────────────────────

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
  const variationSection = buildVariationGuideSection(options.theme);

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
- **MANDATORY: Follow the DESIGN THEME OPTION section EXACTLY — including the accessory count limits. Do not overfill artwork with props.**
- Decide the character form clearly for the concept according to the CHARACTER FORM OPTION section.
- If two forms overlap, choose a single broad label such as "cartoon animal", "fantasy mascot", or "doodle creature".

## ACCESSORY DISCIPLINE — CRITICAL
- Themes other than controlled-accessories: 0-1 prop per prompt maximum. Expression MUST come from face, eyes, and body pose first. Do NOT add random accessories to fill space.
- Theme controlled-accessories: each variation uses EXACTLY ONE themed role with 2-4 matching accessories from ONLY that role's theme. Never mix accessories from different themes within one prompt.
- Every single prop added must have a clear reason tied to the expression or the assigned role. No filler accessories.

## MARKETABLE DESIGN RULES
- Prioritize cute, funny, relatable, and giftable ideas with a clear visual hook.
- The idea must NOT feel like a fixed template. Vary species, object-creatures, stickman concepts, original mascots, poses, props, and mini-stories.
- Strong silhouette, clean line art, print-friendly contrast, and uncluttered composition.
- Make the design readable at thumbnail size.
- Use meaningful variation across pose, action, background/setting, position/perspective, prop, or pattern.
- Colors from the concept palette must appear in every prompt.
- **CRITICAL: ALL 9 prompts must use EXACTLY the same character form. Do NOT change, drift, or substitute the form.**
- Each of the 9 prompts must be meaningfully different in pose, composition, prop, joke, background, or pattern while keeping the same character identity AND form.

${variationSection}

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

  const isControlledAccessories = options.theme === 'controlled-accessories';
  const variationAngle = isControlledAccessories
    ? (() => {
        const g = CONTROLLED_ACCESSORIES_VARIATION_GUIDE[expression];
        return `Role = "${g.role}" | Accessories = ${g.accessories}`;
      })()
    : VARIATION_GUIDE[expression];

  const accessoryRule = isControlledAccessories
    ? `ACCESSORY RULE (controlled-accessories): Use ONLY the accessories listed for this expression's role above. All accessories must share the same theme. Maximum 2-4 accessories. No props from outside the assigned role's theme.`
    : `ACCESSORY RULE (non-controlled theme): Keep props to 0-1 maximum. Expression MUST come from face and body pose first. Do not add accessories to fill space.`;

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
${concept.characterType ? `- Character type: ${concept.characterType}\n` : ''}- Colors: ${concept.colors.join(', ')}
- Style: ${concept.style}
- Product fit: ${concept.productFit ?? 'Keep it product-ready.'}
- Tags: ${(concept.tags ?? []).join(', ')}

TASK: Generate a NEW, DIFFERENT prompt for variation/expression: "${expression}".
Variation angle: ${variationAngle}

${accessoryRule}

OUTPUT: Exactly 1 line of valid minified JSON:
{"type":"design","expression":"${expression}","title":"[short English title]","emoji":"[emoji]","prompt":"[English image prompt]","tips":"[tip in Bahasa Indonesia]"}

ORIGINALITY RULES:
- No brands, logos, celebrities, copyrighted characters, fan art, watermarks, mockups, screenshots, or QR codes.
- Keep the same character identity, palette, and style, but change composition, prop, pose, or micro-story.
- **MANDATORY: Keep EXACTLY the same character form. Do not change or drift from the locked form.**
- **MANDATORY: Follow the TEXT OPTION exactly. If text is locked to 'none', no text at all. If 'auto', include matching short phrase. If 'custom', use exact phrase.**
- **MANDATORY: Follow the DESIGN THEME exactly. Respect accessory discipline rules above.**

PLATFORM STYLE:
${platformGuide}

Return only the JSON line. No markdown. No extra text.`;
}
