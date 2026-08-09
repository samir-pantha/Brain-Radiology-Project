from __future__ import annotations

import json
import threading
from pathlib import Path

import numpy as np
from tensorflow.keras.models import load_model

from app.core.config import IMAGE_SIZE


class InferenceService:
    """Owns one loaded TensorFlow model and its fixed output mapping."""

    def __init__(self, model_path: Path, class_labels_path: Path) -> None:
        self._class_labels = self._load_class_labels(class_labels_path)
        self._model = load_model(model_path, compile=False)
        self._predict_lock = threading.Lock()
        self._validate_model_contract()

    @staticmethod
    def _load_class_labels(class_labels_path: Path) -> list[str]:
        try:
            labels = json.loads(class_labels_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise RuntimeError("Unable to load class-label configuration.") from exc

        if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
            raise RuntimeError("Class-label configuration must be a list of strings.")
        return labels

    def _validate_model_contract(self) -> None:
        expected_shape = (None, IMAGE_SIZE, IMAGE_SIZE, 3)
        if tuple(self._model.input_shape) != expected_shape:
            raise RuntimeError(
                f"Unexpected model input shape {self._model.input_shape}; expected {expected_shape}."
            )
        if self._model.output_shape[-1] != len(self._class_labels):
            raise RuntimeError("Model output size does not match the class-label configuration.")

    def predict(self, image_array: np.ndarray) -> tuple[str, float, dict[str, float]]:
        """Predict from a raw 0-255 float32 RGB batch, as used in the notebook."""
        batch = np.expand_dims(image_array.astype(np.float32, copy=False), axis=0)
        with self._predict_lock:
            scores = self._model.predict(batch, verbose=0)[0]

        predicted_index = int(np.argmax(scores))
        probabilities = {
            label: float(scores[index]) for index, label in enumerate(self._class_labels)
        }
        return self._class_labels[predicted_index], float(scores[predicted_index]), probabilities
