# MyDesignForge

MyDesignForge is a product-focused AI prompt generator for print-on-demand sellers. It creates original, seller-safe design concepts and nine production-ready image prompts for stickers, phone cases, and t-shirt graphics.

The app is optimized for Redbubble-style workflows and supports prompt formats for Midjourney, DALL-E, Stable Diffusion, Kling, and Runway. Sticker prompts can also be sent to a local FLUX.1 + rembg image service to generate transparent PNG previews and downloadable artwork directly from the result cards.

## Features

- Generate one original design concept and nine expression-based prompt variations.
- Target product modes for Sticker, Phone Case, and T-Shirt designs.
- Product-aware prompt rules for aspect ratio, composition, transparent backgrounds, safe margins, and print readability.
- Seller-safety guidance that avoids brands, logos, public figures, copyrighted characters, fan art, mockups, watermarks, and QR codes.
- Character form controls, including animals, humans, doodles, anime, living objects, robots, living food, living plants, cute monsters, and original mascots.
- Text controls for no text, automatic short text, or custom user-provided text.
- Design theme controls for minimalist, simple cute, controlled accessories, kawaii pastel, bold vector, retro 90s, streetwear, goth cute, decorative pattern, and premium mascot styles.
- Streaming prompt generation through a Next.js API route backed by Groq.
- Sticker-only local image generation through a configurable FLUX.1 + rembg HTTP service.
- Per-card prompt copy, edit, regenerate, image preview, and image download actions.
- Export generated prompt packs as `.txt` files.
- Local history storage for previous packs.

## Architecture

```text
Browser UI
  -> Next.js app
     -> /api/generate
        -> Groq chat completion stream
     -> /api/sticker-image
        -> local FLUX.1 + rembg image service
```

The Next.js app handles the UI, prompt generation workflow, validation, and proxy routes. FLUX.1 and rembg are intentionally kept outside the Next.js process so GPU/Python dependencies can run as a separate local service.

## Requirements

- Node.js 20 or newer
- npm
- Groq API key
- Optional: local FLUX.1 + rembg service for sticker image generation

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## One-Command Local AI Mode

To run the Next.js app and the local FLUX.1 + rembg image service together:

```bash
npm run dev:ai
```

On first run, this command will:

- create `.image-service-venv`;
- install PyTorch and the Python image-service dependencies;
- start the local image service at `http://127.0.0.1:8000`;
- start the Next.js app at `http://localhost:3000`;
- inject `STICKER_IMAGE_API_URL=http://127.0.0.1:8000/generate-sticker` into the Next.js process.

If Python 3.10-3.12 is not available, the launcher falls back to Docker and builds `image_service/Dockerfile`.

The first sticker image request may still take several minutes because FLUX.1 weights need to download and load. Accept the model terms on Hugging Face before the first run:

```text
https://huggingface.co/black-forest-labs/FLUX.1-schnell
```

Then authenticate with either:

```bash
huggingface-cli login
```

or set a token before starting:

```bash
$env:HF_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
npm run dev:ai
```

If you prefer, put `HF_TOKEN` in `.env.local` instead. The launcher reads that file automatically.

Docker fallback uses GPU by default:

```bash
$env:DOCKER_GPUS="all"
npm run dev:ai
```

If Docker GPU support is not available:

```bash
$env:DOCKER_GPUS="0"
npm run dev:ai
```

By default the launcher installs CUDA 12.1 PyTorch. For CPU-only mode:

```bash
$env:PYTORCH_INDEX_URL="https://download.pytorch.org/whl/cpu"
$env:FLUX_DEVICE="cpu"
npm run dev:ai
```

Useful overrides:

```bash
$env:NEXT_PORT="3001"
$env:IMAGE_SERVICE_PORT="8001"
$env:FLUX_WIDTH="512"
$env:FLUX_HEIGHT="512"
npm run dev:ai
```

## Environment Variables

Create `.env.local` from `.env.example` and configure:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For local sticker image generation when you manage the image service yourself:

```env
STICKER_IMAGE_API_URL=http://localhost:8000/generate-sticker
STICKER_IMAGE_API_TIMEOUT_MS=600000
```

`STICKER_IMAGE_API_URL` should point to a local service that runs FLUX.1 for image generation and rembg for background removal.

## Local FLUX.1 + rembg Contract

The app calls the local image service through `/api/sticker-image`. The proxy sends this JSON body to `STICKER_IMAGE_API_URL`:

```json
{
  "prompt": "cute blue cat happy sticker, transparent background, die-cut outline",
  "expression": "happy"
}
```

The local service should return:

```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

or a browser-reachable local URL:

```json
{
  "imageUrl": "http://localhost:8000/output/happy.png"
}
```

Image generation controls are rendered only for the Sticker product. Phone Case and T-Shirt modes remain prompt-only.

## Available Scripts

```bash
npm run dev
npm run dev:ai
npm run build
npm run start
npm run type-check
npm run test
```

## Validation

Run the full verification suite before shipping changes:

```bash
npm run test
npm run type-check
npm run build
```

Current coverage includes prompt builder behavior, local storage, random idea generation, prompt generation API, sticker image proxy API, and core UI selector/card interactions.

## Project Structure

```text
src/app
  api/generate        Prompt generation API route
  api/sticker-image   Local sticker image proxy route
  page.tsx            Main app screen

src/components        UI components and tests
src/hooks             Client-side generation, copy, and history hooks
src/lib               Prompt builders, constants, storage, and idea helpers
src/types             Shared domain types
docs/superpowers      Design specs and implementation plans
```

## Product Modes

| Product | Output Focus |
| --- | --- |
| Sticker | Square composition, transparent PNG, die-cut outline, thick white border, clean silhouette |
| Phone Case | Vertical artwork, full-bleed or repeating pattern, safe camera margins, no phone mockup |
| T-Shirt | Centered chest graphic, transparent background, strong silhouette, no shirt mockup |

## Security and Safety

- Groq API keys stay server-side and are never exposed to the browser.
- Server-side validation protects prompt generation inputs.
- `/api/generate` includes simple in-memory rate limiting.
- Generated prompt instructions prioritize original, brand-safe artwork.
- The local image service URL is called from the server-side proxy, avoiding browser CORS requirements.

## Notes

- FLUX.1 and rembg are not bundled in this repository.
- Local sticker image generation requires a separate image service running on your machine.
- If `STICKER_IMAGE_API_URL` is not configured, prompt generation still works and sticker cards show a clear image-service error when image generation is requested.

## Troubleshooting

- `npm run dev:ai` only starts the local image service if it can find a supported Python runtime or Docker Desktop.
- If sticker image requests time out on the first run, keep the process running. The initial FLUX.1 download can take several minutes.
- If Hugging Face returns access or cache errors, confirm that your token is saved in `.env.local` and that your account has accepted access to `black-forest-labs/FLUX.1-schnell`.
- If the Docker fallback cannot reach Hugging Face, check VPN, proxy, firewall, and Docker Desktop network access.
- Phone Case and T-Shirt outputs are prompt-only by design. Sticker cards are the only ones that show image preview and download controls.

## License

MIT
