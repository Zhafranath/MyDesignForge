# Reference Image Character Design

## Goal

Add an optional reference image upload flow so users can generate prompt packs from a character image instead of manually choosing a character form. When a reference image is present, the app analyzes the image with a vision model, turns it into a detailed character description, and uses that description as the locked character identity for the concept and all nine prompt variations.

## User Flow

1. User uploads a PNG, JPG, JPEG, or WEBP image in the main input form.
2. The app shows a preview thumbnail and a remove button.
3. While a reference image is active, the Character Form selector is disabled or hidden because the character form comes from the uploaded image.
4. User can still enter optional written direction, such as "make it more kawaii" or "turn this into a sticker pack."
5. User can still choose product, text mode, custom text, design theme, and target prompt platform.
6. On Generate, the app sends the written direction plus image data to `/api/generate`.
7. Backend analyzes the image into a concise but detailed character reference description.
8. Backend generates the normal concept plus nine prompt variations using that reference description as the locked character identity.

## UI Design

Add a `ReferenceImageInput` component inside the main input card, near the text prompt and before character form controls.

The component should:

- accept image files only: `image/png`, `image/jpeg`, `image/webp`;
- enforce a max file size of 4 MB;
- read the selected image as a data URL;
- display a stable square preview area;
- show the file name or a short "Reference image active" label;
- include a remove button;
- surface validation errors through toast or inline text.

When a reference image is active:

- do not require the user to choose a manual character form;
- show a compact disabled state explaining that the character form is taken from the image;
- still pass existing `generationOptions.characterForm`, but backend should treat it as `auto` for reference-image requests.

## API Contract

Extend `/api/generate` request body with:

```json
{
  "referenceImage": {
    "dataUrl": "data:image/png;base64,...",
    "mimeType": "image/png",
    "name": "character.png"
  }
}
```

Validation rules:

- `referenceImage` is optional.
- `dataUrl` must be a valid data URL with PNG, JPEG, or WEBP media type.
- decoded base64 size must be <= 4 MB.
- if the image is present, written `description` can be shorter than normal, but still allow a small direction string. If no direction is supplied, use a default direction like "Create a sticker-ready character prompt pack from this reference image."

## Vision Analysis

Add a helper in the generate route or nearby module:

```ts
analyzeReferenceImage(referenceImage, userDirection): Promise<string>
```

It should call Groq chat completions with a vision-capable model configured by:

```env
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

If `GROQ_VISION_MODEL` is not set, use a documented default in code.

The vision prompt should ask for:

- character form/species/object type;
- body shape and proportions;
- face, eyes, mouth, expression, and personality cues;
- dominant colors and accent colors;
- clothing, accessories, props, markings, textures;
- pose and silhouette;
- visual style of the reference image;
- details that must be preserved;
- details that should be avoided or simplified for print.

The response should be plain text, not JSON, because it is an intermediate prompt ingredient.

## Prompt Generation

Extend `GenerationOptions` or add a separate reference context field so `buildSystemPrompt` and `buildRegeneratePrompt` can include:

- `Reference image character description: ...`
- "The uploaded reference image is the locked character source."
- "Do not change the character form, species/object type, palette, signature accessories, or silhouette."
- "Use the reference as inspiration for an original, seller-safe design. If the reference resembles a copyrighted character, transform it into a safer original archetype."

When reference image context exists:

- replace the normal Character Form section with a reference-image lock section;
- concept `characterType` should be inferred from the image description;
- all nine prompt strings must explicitly preserve the reference character identity;
- variations may change pose, expression, role, and small scene details, but not the core character.

Regenerate should carry the same reference-derived concept lock through the existing concept object. It does not need to resend the image if the generated concept description already contains the analyzed reference description.

## Error Handling

Frontend:

- reject unsupported type or >4 MB before sending;
- clear the preview when user removes the image;
- keep existing errors for missing custom text.

Backend:

- return `400` for invalid image payloads;
- return a clear `502`/`503` style error if image analysis fails;
- do not log the full base64 image data;
- preserve existing rate limiting.

## Testing

Add focused tests for:

- prompt builder includes reference-image lock instructions when reference context is present;
- prompt builder does not require or enforce manual character form when reference context exists;
- `/api/generate` rejects invalid image MIME type;
- `/api/generate` rejects oversized image payload;
- `/api/generate` calls the vision model before prompt generation when `referenceImage` is supplied;
- UI upload component accepts valid images, shows preview, removes image, and rejects invalid files.

## Non-Goals

- No persistent image storage.
- No user account or image gallery.
- No image-to-image SDXL pipeline in this feature.
- No automatic background removal before prompt generation.
- No guarantee that the final SDXL image will match the reference pixel-perfectly; the feature is prompt-guided character reference, not exact image cloning.
