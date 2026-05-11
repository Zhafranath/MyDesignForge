# Local FLUX.1 + rembg Sticker Images Design

## Goal

Add optional local image generation for sticker prompts only. Sticker cards should continue to show the generated prompt, then allow the user to generate and download a sticker image from a local FLUX.1 + rembg service. Phone case and t-shirt results stay prompt-only and do not show image controls.

## Scope

- Add a Next.js API proxy endpoint that calls a separate local image service over HTTP.
- Add client-side state for per-sticker image generation.
- Show image preview and image download controls only when `targetProduct` is `sticker`.
- Preserve the existing prompt generation, copy, edit, regenerate, export, and history behavior.
- Document the required local service URL in environment examples.

Out of scope:

- Running FLUX.1 or rembg directly inside the Next.js process.
- Adding a Python/GPU Docker service in this change.
- Image generation for phone case or t-shirt products.

## Architecture

The Next.js app remains responsible for prompt generation and UI. A new internal route, `/api/sticker-image`, acts as a small proxy to a local image service configured by `STICKER_IMAGE_API_URL`.

The local service is expected to handle:

1. FLUX.1 image generation from the sticker prompt.
2. Background removal through rembg.
3. Returning a transparent PNG as either a data URL or a URL reachable by the browser.

This keeps GPU/Python dependencies outside the frontend app and makes the Next.js code testable without a real model server.

## API Contract

Request to `/api/sticker-image`:

```json
{
  "prompt": "English sticker image prompt",
  "expression": "happy"
}
```

Proxy request to `STICKER_IMAGE_API_URL` uses the same JSON body.

Accepted successful responses from the local service:

```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

or:

```json
{
  "imageUrl": "http://localhost:8000/output/happy.png"
}
```

The proxy returns:

```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

Errors return `{ "message": "..." }` with an appropriate HTTP status.

## UI Behavior

Sticker cards receive `targetProduct`.

For `sticker`:

- Show the prompt exactly as today.
- Add a stable image area below the prompt.
- Add a button to generate the image for that card.
- While generating, show a loading state in the image area.
- On success, show the image preview and a download button.
- On failure, show a concise error and allow retry.
- If the prompt is edited, image generation uses the edited prompt.

For `phone-case` and `t-shirt`:

- Do not render the image area.
- Do not render the generate image or download image buttons.
- Existing copy, edit, and regenerate controls remain unchanged.

## Data Model

Extend `StickerPrompt` with optional image state fields only if needed by shared state. Prefer keeping transient image generation state in the card component or a small hook, because generated images are local workflow output and should not affect prompt history/export unless explicitly added later.

## Error Handling

- Missing `STICKER_IMAGE_API_URL`: return a clear 500 message explaining the local image service is not configured.
- Invalid request body: return 400.
- Local service timeout or network error: return 504 with a retryable message.
- Local service non-OK response: propagate a clean failure message without leaking stack traces.
- Invalid success payload without `imageUrl`: return 502.

## Configuration

Add to `.env.example`:

```env
STICKER_IMAGE_API_URL=http://localhost:8000/generate-sticker
STICKER_IMAGE_API_TIMEOUT_MS=120000
```

## Testing

- Unit tests for `/api/sticker-image`:
  - rejects invalid prompt.
  - rejects invalid expression.
  - fails clearly when service URL is missing.
  - proxies a successful `imageUrl` response.
  - handles upstream failure.
- Component tests for `StickerCard`:
  - sticker product renders image generation controls.
  - phone case and t-shirt products do not render image controls.
  - clicking generate image uses the current edited prompt.
  - successful image response renders preview and download control.

## Risks

- Large data URLs can increase memory use in the browser. The service may return hosted local URLs instead when images are large.
- Local service CORS does not matter to the browser because Next.js proxies the call.
- Real generation can take a long time, so the client and proxy need a long timeout and clear loading state.
