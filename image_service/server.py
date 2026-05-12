from __future__ import annotations

import base64
import hashlib
import os
import threading
from io import BytesIO

import torch
from diffusers import FluxPipeline
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel, Field
from rembg import new_session, remove

MODEL_ID = os.getenv("FLUX_MODEL_ID", "black-forest-labs/FLUX.1-schnell")
REMBG_MODEL = os.getenv("REMBG_MODEL", "u2net")

_pipe: FluxPipeline | None = None
_rembg_session = None
_model_lock = threading.Lock()

app = FastAPI(title="MyDesignForge Local Image Service")


class StickerRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=5000)
    expression: str = Field(min_length=1, max_length=32)


def env_int(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, ""))
        return value if value > 0 else default
    except ValueError:
        return default


def select_device() -> str:
    requested = os.getenv("FLUX_DEVICE", "auto").lower()
    if requested in {"cpu", "cuda"}:
        return requested
    return "cuda" if torch.cuda.is_available() else "cpu"


def select_dtype(device: str) -> torch.dtype:
    requested = os.getenv("FLUX_DTYPE", "auto").lower()
    if requested == "fp16":
        return torch.float16
    if requested == "bf16":
        return torch.bfloat16
    if requested == "fp32":
        return torch.float32
    return torch.bfloat16 if device == "cuda" else torch.float32


def get_pipe() -> FluxPipeline:
    global _pipe
    if _pipe is not None:
        return _pipe

    with _model_lock:
        if _pipe is not None:
            return _pipe

        device = select_device()
        dtype = select_dtype(device)
        pipe = FluxPipeline.from_pretrained(MODEL_ID, torch_dtype=dtype)

        if device == "cuda":
            use_offload = os.getenv("FLUX_CPU_OFFLOAD", "1") != "0"
            if use_offload:
                pipe.enable_model_cpu_offload()
            else:
                pipe.to("cuda")
        else:
            pipe.to("cpu")

        pipe.set_progress_bar_config(disable=True)
        _pipe = pipe
        return _pipe


def get_rembg_session():
    global _rembg_session
    if _rembg_session is None:
        _rembg_session = new_session(REMBG_MODEL)
    return _rembg_session


def deterministic_seed(prompt: str, expression: str) -> int:
    digest = hashlib.sha256(f"{prompt}:{expression}".encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def to_data_url(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def normalize_cutout(output) -> Image.Image:
    if isinstance(output, Image.Image):
        return output
    return Image.open(BytesIO(output))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_ID,
        "device": select_device(),
        "loaded": _pipe is not None,
    }


@app.post("/generate-sticker")
def generate_sticker(request: StickerRequest):
    try:
        pipe = get_pipe()
        width = env_int("FLUX_WIDTH", 768)
        height = env_int("FLUX_HEIGHT", 768)
        steps = env_int("FLUX_STEPS", 4)
        seed = deterministic_seed(request.prompt, request.expression)

        prompt = (
            f"{request.prompt}, transparent background, sticker-ready, die-cut outline, "
            "thick white border, centered composition, clean silhouette"
        )

        image = pipe(
            prompt=prompt,
            guidance_scale=0.0,
            num_inference_steps=steps,
            max_sequence_length=256,
            height=height,
            width=width,
            generator=torch.Generator("cpu").manual_seed(seed),
        ).images[0]

        cutout = normalize_cutout(remove(image, session=get_rembg_session()))
        return {"imageUrl": to_data_url(cutout.convert("RGBA"))}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
