# SDXL Turbo Local Image Service Design

## Goal

Replace the built-in local sticker image model from FLUX.1 to SDXL Turbo while keeping the Next.js app and `/generate-sticker` HTTP contract unchanged.

## Scope

- Use `stabilityai/sdxl-turbo` as the default image generation model.
- Support a downloaded local Diffusers model folder through `SDXL_MODEL_PATH`.
- Keep rembg background removal so generated sticker images remain transparent PNG data URLs.
- Keep legacy `FLUX_*` environment variables as fallbacks during migration.
- Update local launcher, Docker fallback, README, and `.env.example`.

## Architecture

The browser and Next.js routes stay unchanged. `src/app/api/sticker-image` continues to proxy requests to the Python service. The Python service swaps `FluxPipeline` for `AutoPipelineForText2Image`, loads either `SDXL_MODEL_PATH` or `SDXL_MODEL_ID`, and runs SDXL Turbo with `guidance_scale=0.0`.

SDXL Turbo defaults:

- model id: `stabilityai/sdxl-turbo`
- width/height: `512`
- steps: `1`
- guidance scale: `0.0`

These defaults follow the Hugging Face SDXL Turbo model card, which recommends 512x512 and notes that one step is enough for high-quality output.

## Configuration

Primary variables:

```env
SDXL_MODEL_PATH=C:\models\sdxl-turbo
SDXL_MODEL_ID=stabilityai/sdxl-turbo
SDXL_WIDTH=512
SDXL_HEIGHT=512
SDXL_STEPS=1
SDXL_DEVICE=auto
SDXL_DTYPE=auto
SDXL_CPU_OFFLOAD=1
```

Legacy fallback variables:

```env
FLUX_MODEL_PATH=
FLUX_MODEL_ID=
FLUX_WIDTH=
FLUX_HEIGHT=
FLUX_STEPS=
FLUX_DEVICE=
FLUX_DTYPE=
FLUX_CPU_OFFLOAD=
```

## Error Handling

Existing FastAPI error behavior remains: generation failures return HTTP 500 with the underlying message. `/health` reports the selected model source, selected device, and whether the pipeline is loaded.

## Testing

- Update launcher tests to verify SDXL env forwarding, Docker model mount behavior, and legacy fallback warning behavior.
- Run focused Vitest tests for `scripts/dev-local-ai.mjs`.
- Run type-check/build if feasible after code changes.

