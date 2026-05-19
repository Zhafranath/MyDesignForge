# SDXL Turbo Local Image Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the built-in local sticker image service model from FLUX.1 to SDXL Turbo while preserving local app behavior.

**Architecture:** Keep the frontend and `/api/sticker-image` proxy unchanged. Update only the Python image service, local launcher, Docker env forwarding, tests, and setup documentation. Support `SDXL_*` variables as primary config and `FLUX_*` as temporary legacy fallbacks.

**Tech Stack:** Next.js 15, Vitest, Node launcher script, FastAPI, Diffusers, PyTorch, rembg, Hugging Face local Diffusers model folders.

---

### Task 1: Launcher Tests

**Files:**
- Modify: `scripts/__tests__/dev-local-ai.test.mjs`

- [ ] Write failing tests that expect `SDXL_MODEL_PATH`, `SDXL_WIDTH`, and `SDXL_MODEL_ID` to be used by Docker run args.
- [ ] Write a failing test that expects `shouldWarnAboutMissingHfToken` to skip warning when `SDXL_MODEL_PATH` is set.
- [ ] Run: `npm run test -- scripts/__tests__/dev-local-ai.test.mjs`
- [ ] Expected before implementation: failures mentioning missing SDXL env behavior.

### Task 2: Launcher Implementation

**Files:**
- Modify: `scripts/dev-local-ai.mjs`

- [ ] Rename Docker local model mount constant to `/models/local-sdxl`.
- [ ] Mount `SDXL_MODEL_PATH` first, with fallback to `FLUX_MODEL_PATH`.
- [ ] Forward `SDXL_MODEL_ID`, `SDXL_MODEL_PATH`, `SDXL_DEVICE`, `SDXL_DTYPE`, `SDXL_CPU_OFFLOAD`, `SDXL_WIDTH`, `SDXL_HEIGHT`, and `SDXL_STEPS`.
- [ ] Keep legacy `FLUX_*` forwarding.
- [ ] Update missing-token warning logic to check both `SDXL_MODEL_PATH` and `FLUX_MODEL_PATH`.
- [ ] Run: `npm run test -- scripts/__tests__/dev-local-ai.test.mjs`
- [ ] Expected after implementation: launcher tests pass.

### Task 3: Python Image Service

**Files:**
- Modify: `image_service/server.py`

- [ ] Replace `FluxPipeline` with `AutoPipelineForText2Image`.
- [ ] Add env helpers that prefer `SDXL_*` and fall back to `FLUX_*`.
- [ ] Default model id to `stabilityai/sdxl-turbo`.
- [ ] Default size to 512x512 and steps to 1.
- [ ] Remove FLUX-only `max_sequence_length` from generation call.
- [ ] Keep deterministic seed and rembg cutout behavior.
- [ ] Run: `python -m compileall image_service`
- [ ] Expected: compile succeeds.

### Task 4: Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] Replace visible FLUX setup instructions with SDXL Turbo setup instructions.
- [ ] Add step-by-step Windows local model download guidance.
- [ ] Document `SDXL_MODEL_PATH=C:\models\sdxl-turbo`.
- [ ] Mention legacy `FLUX_*` fallback only as migration compatibility.
- [ ] Include the Hugging Face model URL: `https://huggingface.co/stabilityai/sdxl-turbo`.

### Task 5: Verification

**Files:**
- No production edits.

- [ ] Run: `npm run test -- scripts/__tests__/dev-local-ai.test.mjs`
- [ ] Run: `python -m compileall image_service`
- [ ] Run broader checks if local dependencies allow: `npm run type-check` and `npm run build`.
- [ ] Report exact commands and any failures.

