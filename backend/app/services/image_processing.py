from __future__ import annotations

from io import BytesIO

import numpy as np
from fastapi import HTTPException, status
from PIL import Image, UnidentifiedImageError

from app.core.config import ALLOWED_IMAGE_FORMATS, IMAGE_SIZE, MAX_IMAGE_PIXELS


Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode an allowed image into raw 0-255 float32 RGB pixels.

    This mirrors the notebook's load_img(..., target_size=(224, 224)) and
    img_to_array calls. EfficientNet's saved preprocessing layers normalize it.
    """
    try:
        with Image.open(BytesIO(image_bytes)) as source:
            if source.format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Only JPEG and PNG images are supported.",
                )
            image = source.convert("RGB")
            image = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.NEAREST)
            return np.asarray(image, dtype=np.float32)
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image dimensions exceed the allowed limit.",
        ) from exc
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file is not a valid image.",
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The image could not be decoded.",
        ) from exc
