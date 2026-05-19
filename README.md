# MyDesignForge

MyDesignForge is a product-focused AI prompt generator for print-on-demand sellers. It creates one original, seller-safe design concept and nine production-ready prompt variations for stickers, phone cases, and t-shirt graphics.

The app is optimized for Redbubble-style workflows. Prompt generation is handled by a Next.js API route backed by Groq. Sticker prompts can optionally be sent to a local SDXL Turbo + rembg image service so the app can generate transparent PNG previews and downloadable artwork from each sticker card.

## Features

- Generate one original design concept and nine expression-based prompt variations.
- Product modes for Sticker, Phone Case, and T-Shirt designs.
- Prompt rules for aspect ratio, transparent backgrounds, safe margins, print readability, and product-specific composition.
- Seller-safety guidance that avoids brands, logos, celebrities, copyrighted characters, fan art, mockups, watermarks, and QR codes.
- Optional character reference image upload for PNG, JPG, and WEBP files up to 4 MB.
- Character form controls: animal, human, cartoon, doodle, anime, living object, stickman, fantasy creature, robot, living food, living plant, cute monster, and original mascot.
- Text controls: no text, automatic expression text, or exact custom text.
- Theme controls: minimalist, simple cute, controlled accessories, kawaii pastel, bold vector, retro 90s, streetwear, goth cute, decorative pattern, and premium mascot.
- Streaming prompt generation through `/api/generate`.
- Sticker-only local image generation through `/api/sticker-image` and the Python SDXL service.
- Per-card copy, edit, regenerate, image preview, and PNG download controls.
- Export generated prompt packs as `.txt` files.
- Local browser history for previous packs.

## Architecture

```text
Browser UI
  -> Next.js app
     -> /api/generate
        -> Groq chat completion stream
     -> /api/sticker-image
        -> local SDXL Turbo + rembg image service
```

The Next.js app owns the UI, prompt workflow, validation, and proxy routes. SDXL Turbo and rembg run outside the Next.js process because the image stack needs Python, PyTorch, and optional GPU dependencies.

## Requirements

Required for prompt generation:

- Node.js 20 or newer
- npm
- Groq API key from `https://console.groq.com`

Required for local sticker image generation:

- Python 3.10, 3.11, or 3.12, recommended: Python 3.11
- OR Docker Desktop as fallback
- Enough disk space for SDXL Turbo and PyTorch dependencies
- Optional GPU:
  - NVIDIA CUDA: default PyTorch install target is CUDA 12.1
  - Intel Arc: use the XPU PyTorch wheel
  - CPU mode works but is much slower

## Quick Start: Prompt Generator Only

Use this mode if you only want prompt generation without local SDXL images.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Set at least this value in `.env.local`:

```env
GROQ_API_KEY=gsk_your_real_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Quick Start: App + Local SDXL

Use this mode if you want the sticker cards to generate downloadable transparent PNG images.

```bash
npm install
copy .env.example .env.local
npm run dev:ai
```

`npm run dev:ai` does the following:

- creates `.image-service-venv`;
- installs PyTorch and `image_service/requirements.txt`;
- starts the Python image service at `http://127.0.0.1:8000`;
- starts the Next.js app at `http://localhost:3000`;
- injects `STICKER_IMAGE_API_URL=http://127.0.0.1:8000/generate-sticker` into the Next.js process.

If Python setup fails and Docker Desktop is available, the launcher builds `image_service/Dockerfile` and runs the image service in Docker.

## Recommended `.env.local`

```env
# Required for prompt generation
GROQ_API_KEY=gsk_your_real_key_here
GROQ_MODEL=llama-3.1-8b-instant
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Used by the local image proxy
STICKER_IMAGE_API_URL=http://localhost:8000/generate-sticker
STICKER_IMAGE_API_TIMEOUT_MS=600000

# Ports
NEXT_PORT=3000
IMAGE_SERVICE_PORT=8000

# SDXL Turbo defaults
SDXL_MODEL_ID=stabilityai/sdxl-turbo
SDXL_WIDTH=512
SDXL_HEIGHT=512
SDXL_STEPS=1
SDXL_DEVICE=auto
SDXL_DTYPE=auto

# Optional: point to a downloaded local Diffusers model
# SDXL_MODEL_PATH=C:\models\sdxl-turbo

# Optional: Hugging Face token if loading from Hub
# HF_TOKEN=hf_your_token_here
```

Do not commit real API keys or Hugging Face tokens.

## Install SDXL Turbo Locally

The image service can load SDXL Turbo in two ways:

1. **Local model folder** through `SDXL_MODEL_PATH`.
2. **Hugging Face Hub** through `SDXL_MODEL_ID` and optional `HF_TOKEN`.

Local model folder is recommended because it avoids repeated downloads and token problems.

### Option A: Download With Hugging Face CLI

Windows PowerShell:

```powershell
mkdir C:\models
python -m pip install -U "huggingface_hub[cli]"
huggingface-cli download stabilityai/sdxl-turbo --local-dir C:\models\sdxl-turbo --local-dir-use-symlinks False
```

Then set:

```env
SDXL_MODEL_PATH=C:\models\sdxl-turbo
SDXL_MODEL_ID=stabilityai/sdxl-turbo
```

The folder must contain a complete Diffusers pipeline, including `model_index.json`, model configs, tokenizer files, scheduler config, and `.safetensors` weights.

### Option B: Download With Git LFS

Install Git LFS first, then run:

```powershell
git lfs install
git clone https://huggingface.co/stabilityai/sdxl-turbo C:\models\sdxl-turbo
```

Then set:

```env
SDXL_MODEL_PATH=C:\models\sdxl-turbo
```

### Option C: Load From Hugging Face Hub

If `SDXL_MODEL_PATH` is not set, the service loads:

```env
SDXL_MODEL_ID=stabilityai/sdxl-turbo
```

If the model is not cached locally, authenticate first:

```powershell
python -m pip install -U "huggingface_hub[cli]"
huggingface-cli login
```

Or set a token:

```env
HF_TOKEN=hf_your_token_here
```

Then start:

```powershell
npm run dev:ai
```

The first image request can take several minutes because model weights may need to download and load into memory.

## GPU and CPU Modes

### NVIDIA CUDA

This is the default local Python install path used by `npm run dev:ai`:

```env
PYTORCH_INDEX_URL=https://download.pytorch.org/whl/cu121
SDXL_DEVICE=auto
SDXL_DTYPE=auto
```

If CUDA is available, the service selects `cuda`. Otherwise it falls back to CPU unless XPU is available.

### Intel Arc / XPU

Use Intel PyTorch wheels and force XPU:

```powershell
$env:PYTORCH_INDEX_URL="https://download.pytorch.org/whl/xpu"
$env:SDXL_DEVICE="xpu"
$env:SDXL_DTYPE="fp16"
npm run dev:ai
```

Or put this in `.env.local`:

```env
PYTORCH_INDEX_URL=https://download.pytorch.org/whl/xpu
SDXL_DEVICE=xpu
SDXL_DTYPE=fp16
```

The service uses `torch.xpu`, not CUDA, for Intel GPU mode. Check:

```text
http://127.0.0.1:8000/health
```

If it returns `"device": "xpu"`, XPU mode is active.

For XPU, dimensions are capped at `512x512` in the service to reduce local VRAM pressure.

### CPU Only

CPU works but is slow:

```powershell
$env:PYTORCH_INDEX_URL="https://download.pytorch.org/whl/cpu"
$env:SDXL_DEVICE="cpu"
npm run dev:ai
```

Or:

```env
PYTORCH_INDEX_URL=https://download.pytorch.org/whl/cpu
SDXL_DEVICE=cpu
```

### Docker Fallback

If Python setup fails, `npm run dev:ai` can fall back to Docker Desktop.

Docker GPU mode:

```powershell
$env:DOCKER_GPUS="all"
npm run dev:ai
```

Docker CPU fallback:

```powershell
$env:DOCKER_GPUS="0"
npm run dev:ai
```

If `SDXL_MODEL_PATH` points to a local folder, the Docker launcher mounts that folder read-only into the container.

## Manual Image Service Start

Normally you should use:

```bash
npm run dev:ai
```

Manual mode is useful when debugging the Python service directly.

```powershell
python -m venv .image-service-venv
.\.image-service-venv\Scripts\python.exe -m pip install --upgrade pip
.\.image-service-venv\Scripts\python.exe -m pip install --upgrade --force-reinstall torch torchvision --index-url https://download.pytorch.org/whl/cu121
.\.image-service-venv\Scripts\python.exe -m pip install -r image_service\requirements.txt
.\.image-service-venv\Scripts\python.exe -m uvicorn image_service.server:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
$env:STICKER_IMAGE_API_URL="http://127.0.0.1:8000/generate-sticker"
npm run dev
```

Health check:

```text
http://127.0.0.1:8000/health
```

## How To Generate Sticker Images

1. Start the app with `npm run dev:ai`.
2. Open `http://localhost:3000`.
3. Enter a design idea.
4. Choose product: `Sticker`.
5. Choose text mode:
   - `Tanpa tulisan`: no readable text.
   - `Tulisan otomatis`: the app asks the AI to create short expression text.
   - `Tulisan custom`: the app asks the AI to use your exact text.
6. Click Generate.
7. On a sticker card, click `Generate Image`.
8. Download the PNG from the download button.

Image generation controls are only shown for Sticker mode. Phone Case and T-Shirt remain prompt-only.

## Character Reference Image Upload

Use this when you want the generated character to follow an uploaded image instead of a manually selected character form.

1. Upload a PNG, JPG, or WEBP image in the reference image field.
2. Keep the file at 4 MB or smaller.
3. Add optional text direction in the description field if you want a specific mood, product angle, or audience.
4. Click Generate.

When a reference image is active, the app disables the character form selector. The server sends the image to the configured Groq vision model, converts the visible character into a detailed description, then locks the generated prompt pack to that character identity.

Set this value in `.env.local` to choose the vision model:

```env
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Uploaded reference images are validated server-side and are not written to the repository or local image service output folder. They are sent as request data for prompt analysis.

## Text Quality Notes

SDXL Turbo can generate simple lettering, but it is not as reliable as dedicated text-rendering or image-editing tools. For better results:

- Use short text, ideally 1-2 words.
- Prefer uppercase: `WOW`, `NOPE`, `HELLO`.
- Avoid long sentences.
- Avoid tiny text.
- Use custom text with a clean sign, badge, or speech bubble.
- Regenerate if the text is misspelled; diffusion models can still distort letters.

The app now makes custom sticker text prominent in prompts and prioritizes it in the local SDXL prompt as `large readable exact text "...", do not omit text`.

## Full-Body Sticker Framing Notes

The local SDXL prompt also prioritizes:

- full body complete character visible;
- head-to-toe composition;
- centered with safe margins;
- wide framing;
- no close-up;
- no cropped head;
- no cut off body;
- no out of frame.

This reduces head-only or cropped sticker outputs, although diffusion output can still vary by seed and prompt complexity.

## Local Image Service Contract

The Next.js route `/api/sticker-image` sends this JSON body to `STICKER_IMAGE_API_URL`:

```json
{
  "prompt": "Sticker design prompt:\nCharacter form: cute animal mascot.\nMain character: blue cat.\nText in design: text reading \"WOW!\".\nTheme: simple cute kawaii.\nExpression: happy.\nPose/action: jumping.\nVisual style: clean vector sticker.\nComposition: full body complete character visible.\nSticker details: transparent background, thick white border.\nAvoid: watermark, logo.",
  "expression": "happy"
}
```

The local service returns:

```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

or a browser-reachable URL:

```json
{
  "imageUrl": "http://localhost:8000/output/happy.png"
}
```

## Available Scripts

```bash
npm run dev          # Next.js only
npm run dev:ai       # Next.js + local SDXL image service
npm run build        # Production build
npm run start        # Start built Next.js app
npm run type-check   # TypeScript check
npm run test         # Vitest suite
npm run test:watch   # Vitest watch mode
```

## Validation

Run these before shipping changes:

```bash
npm run test
npm run type-check
npm run build
```

Python image service tests:

```bash
python -m unittest image_service.test_server
```

Current coverage includes prompt builder behavior, random idea generation, local storage, prompt generation API, sticker image proxy API, script helpers, image service prompt handling, and core UI components.

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

image_service         FastAPI SDXL Turbo + rembg service
scripts               Local AI launcher
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
- Do not commit `.env.local`, real API keys, Hugging Face tokens, downloaded model weights, or `.image-service-venv`.

## Troubleshooting

### `npm run dev:ai` cannot find Python

Install Python 3.11 and ensure `python --version` or `py -3.11 --version` works.

### First image request is very slow

The model may be downloading or loading into memory. Keep the terminal running and wait. Use `SDXL_MODEL_PATH` for faster repeat starts.

### Hugging Face access or cache errors

- Confirm `SDXL_MODEL_PATH` points to a complete model folder; or
- set `HF_TOKEN`; or
- run `huggingface-cli login`.

### Docker cannot download the model

Check VPN, firewall, proxy, Docker Desktop network access, and Hugging Face token forwarding.

### GPU out of memory

Try:

```env
SDXL_WIDTH=512
SDXL_HEIGHT=512
SDXL_STEPS=1
SDXL_DTYPE=fp16
```

For Docker CPU fallback:

```powershell
$env:DOCKER_GPUS="0"
npm run dev:ai
```

### Sticker image is cropped

Regenerate the prompt or image. The service prioritizes full-body framing, but very cluttered prompts can still push the subject out of frame.

### Custom text is missing or misspelled

Use shorter uppercase text and regenerate. SDXL Turbo is not fully reliable for exact lettering, but the app now makes custom text a mandatory prompt element and prioritizes it before the compacted visual prompt.

### Phone Case and T-Shirt do not show image buttons

This is intentional. Local image generation currently supports Sticker mode only.

## License

MIT
