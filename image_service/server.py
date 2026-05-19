from __future__ import annotations

import base64
import hashlib
import os
import re
import threading
from io import BytesIO

import torch
from diffusers import AutoPipelineForText2Image
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel, Field
from rembg import new_session, remove

MODEL_ID = os.getenv("SDXL_MODEL_ID") or os.getenv("FLUX_MODEL_ID") or "stabilityai/sdxl-turbo"
MODEL_PATH = os.getenv("SDXL_MODEL_PATH") or os.getenv("FLUX_MODEL_PATH")
REMBG_MODEL = os.getenv("REMBG_MODEL", "u2net")

_pipe: AutoPipelineForText2Image | None = None
_rembg_session = None
_model_lock = threading.Lock()
_generation_lock = threading.Lock()

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


def model_env(name: str) -> str | None:
    value = os.getenv(f"SDXL_{name}") or os.getenv(f"FLUX_{name}")
    return value.strip() if value and value.strip() else None


def select_device() -> str:
    requested = (model_env("DEVICE") or "auto").lower()
    if requested == "cpu":
        return requested
    if requested == "cuda" and torch.cuda.is_available():
        return "cuda"
    if requested == "xpu" and hasattr(torch, "xpu") and torch.xpu.is_available():
        return "xpu"
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        return "xpu"
    return "cuda" if torch.cuda.is_available() else "cpu"


def select_dtype(device: str) -> torch.dtype:
    requested = (model_env("DTYPE") or "auto").lower()
    if device == "cpu":
        return torch.float32
    if requested == "fp16":
        return torch.float16
    if requested == "bf16":
        return torch.bfloat16
    if requested == "fp32":
        return torch.float32
    return torch.float16 if device in {"cuda", "xpu"} else torch.float32


def select_dimensions(device: str) -> tuple[int, int]:
    width = env_int("SDXL_WIDTH", env_int("FLUX_WIDTH", 512))
    height = env_int("SDXL_HEIGHT", env_int("FLUX_HEIGHT", 512))
    if device == "xpu":
        return min(width, 512), min(height, 512)
    return width, height


def build_sticker_prompt(user_prompt: str) -> str:
    sticker_prefix = (
        "transparent background, sticker-ready, die-cut outline, thick white border, "
        "full body complete character visible, head-to-toe, centered with safe margins, "
        "wide framing, clean silhouette, sharp edges, no close-up, no cropped head, "
        "no cut off body, no out of frame"
    )
    structured_values = []
    wanted_labels = (
        "character form",
        "main character",
        "text in design",
        "theme",
        "expression",
        "pose/action",
        "visual style",
        "composition",
    )
    for raw_line in user_prompt.splitlines():
        line = raw_line.strip()
        if ":" not in line:
            continue
        label, value = line.split(":", 1)
        if label.strip().lower() in wanted_labels and value.strip():
            structured_values.append(value.strip().rstrip("."))

    compact_prompt = ", ".join(structured_values) if structured_values else user_prompt
    text_match = re.search(r'text reading\s+"([^"]+)"', compact_prompt, flags=re.IGNORECASE)
    text_priority = (
        f'large readable exact text "{text_match.group(1)}", do not omit text'
        if text_match and "no readable text" not in compact_prompt.lower()
        else ""
    )
    user_words = compact_prompt.replace("\n", " ").split()
    prompt_parts = [sticker_prefix]
    if text_priority:
        prompt_parts.append(text_priority)
    prompt_parts.append(" ".join(user_words[:48]))
    prompt_words = ", ".join(prompt_parts).split()
    return " ".join(prompt_words[:72])


def get_hf_token() -> str | None:
    token = os.getenv("HUGGINGFACE_HUB_TOKEN") or os.getenv("HF_TOKEN")
    return token.strip() if token and token.strip() else None


def get_model_path() -> str | None:
    return MODEL_PATH.strip() if MODEL_PATH and MODEL_PATH.strip() else None


def get_model_source() -> str:
    return get_model_path() or MODEL_ID


def get_pipe() -> AutoPipelineForText2Image:
    global _pipe
    if _pipe is not None:
        return _pipe

    with _model_lock:
        if _pipe is not None:
            return _pipe

        device = select_device()
        dtype = select_dtype(device)
        model_path = get_model_path()
        if model_path:
            pipe = AutoPipelineForText2Image.from_pretrained(
                model_path,
                torch_dtype=dtype,
                local_files_only=True,
            )
        else:
            pipe = AutoPipelineForText2Image.from_pretrained(
                MODEL_ID,
                torch_dtype=dtype,
                token=get_hf_token(),
            )

        if device == "cuda":
            use_offload = (model_env("CPU_OFFLOAD") or "1") != "0"
            if use_offload:
                pipe.enable_model_cpu_offload()
            else:
                pipe.to("cuda")
        elif device == "xpu":
            pipe.to("xpu")
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
        "model": get_model_source(),
        "device": select_device(),
        "loaded": _pipe is not None,
    }


@app.post("/generate-sticker")
def generate_sticker(request: StickerRequest):
    try:
        pipe = get_pipe()
        device = select_device()
        width, height = select_dimensions(device)
        steps = env_int("SDXL_STEPS", env_int("FLUX_STEPS", 1))
        seed = deterministic_seed(request.prompt, request.expression)
        prompt = build_sticker_prompt(request.prompt)

        with _generation_lock:
            image = pipe(
                prompt=prompt,
                guidance_scale=0.0,
                num_inference_steps=steps,
                height=height,
                width=width,
                generator=torch.Generator("cpu").manual_seed(seed),
            ).images[0]

            cutout = normalize_cutout(remove(image, session=get_rembg_session()))
        return {"imageUrl": to_data_url(cutout.convert("RGBA"))}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
