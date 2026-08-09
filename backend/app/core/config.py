from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = PROJECT_ROOT / "backend"

MODEL_PATH = Path(os.getenv("MODEL_PATH", PROJECT_ROOT / "model_vgg16_v2.h5"))
CLASS_LABELS_PATH = BACKEND_ROOT / "app" / "models" / "class_labels.json"

IMAGE_SIZE = 224
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# The API key must be supplied through the environment; never use a key value as
# the environment variable name or embed it in source control.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it-20260403:free")
OPENROUTER_TIMEOUT_SECONDS = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "20"))
