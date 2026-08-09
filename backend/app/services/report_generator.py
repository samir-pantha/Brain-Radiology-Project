from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    OPENROUTER_MODEL,
    OPENROUTER_TIMEOUT_SECONDS,
)
from app.schemas.prediction import ReportRequest, ReportResponse


logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generates safe classifier summaries, with an offline deterministic fallback."""

    def __init__(
        self,
        api_key: str | None = OPENROUTER_API_KEY,
        model: str = OPENROUTER_MODEL,
        timeout_seconds: float = OPENROUTER_TIMEOUT_SECONDS,
    ) -> None:
        self._model = model
        self._client = (
            AsyncOpenAI(
                api_key=api_key,
                base_url=OPENROUTER_BASE_URL,
                timeout=timeout_seconds,
                max_retries=1,
            )
            if api_key
            else None
        )
        logger.info(
            "OpenRouter report generator configured: model=%s",
            self._model,
        )

    async def close(self) -> None:
        if self._client:
            await self._client.close()

    async def generate(self, request: ReportRequest) -> ReportResponse:
        if not self._client:
            logger.warning("OpenRouter report source=fallback: OPENROUTER_API_KEY is not configured.")
            return self._fallback(request)

        try:
            content = await self._request_completion(request)
            report = self._parse_report(content)
            logger.info("OpenRouter report source=ai model=%s", self._model)
            return ReportResponse(**report, source="ai")
        except Exception as exc:
            # Do not surface provider details or credentials to the browser.
            logger.error("OpenRouter report generation failed: %s", exc)
            logger.warning("OpenRouter report source=fallback model=%s", self._model)
            return self._fallback(request)

    async def _request_completion(self, request: ReportRequest) -> str:
        if not self._client:
            raise ValueError("OpenRouter client is not configured.")
        completion = await self._client.chat.completions.create(
            model=self._model,
            temperature=0.1,
            max_tokens=1200,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": self._user_prompt(request)},
            ],
        )
        choice = completion.choices[0]
        if choice.finish_reason == "error":
            raise ValueError("OpenRouter returned an incomplete generation.")
        content = choice.message.content
        if not isinstance(content, str) or not content.strip():
            raise ValueError("OpenRouter returned an empty report.")
        return content

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You create a concise, professional report from AI classifier output. "
            "This is an AI classifier output, not a diagnosis. Do not diagnose. "
            "Do not invent tumor location, tumor size, MRI findings, or radiologist observations. "
            "Do not claim that a tumor is present or absent. "
            "Return valid JSON only, with exactly these string keys: "
            "clinical_summary, impression, recommendation, disclaimer. "
            "Generate only the content for those four sections."
        )

    @staticmethod
    def _user_prompt(request: ReportRequest) -> str:
        # This contains only patient details and classifier metadata. Never attach the MRI image.
        return json.dumps(
            {
                "patient_details": request.patient.model_dump(),
                "predicted_class": request.predicted_class,
                "confidence": request.confidence,
                "class_probabilities": request.probabilities,
            },
            ensure_ascii=False,
        )

    @staticmethod
    def _parse_report(content: str) -> dict[str, str]:
        decoder = json.JSONDecoder()
        parsed: dict[str, Any] | None = None
        last_error: json.JSONDecodeError | None = None

        # raw_decode stops at the end of an object, so it handles markdown
        # fences and any prose before or after the JSON. Keep trying each
        # opening brace until the first valid JSON object is found.
        for json_start, character in enumerate(content):
            if character != "{":
                continue
            try:
                candidate, _ = decoder.raw_decode(content[json_start:])
            except json.JSONDecodeError as exc:
                last_error = exc
                continue
            if isinstance(candidate, dict):
                parsed = candidate
                break

        if parsed is None:
            if last_error is None:
                raise ValueError("OpenRouter response did not contain a JSON object.")
            raise ValueError(f"OpenRouter response contained invalid JSON: {last_error}") from last_error
        if not isinstance(parsed, dict):
            raise ValueError("OpenRouter response JSON was not an object.")
        expected_keys = {"clinical_summary", "impression", "recommendation", "disclaimer"}
        if set(parsed) != expected_keys or not all(
            isinstance(parsed[key], str) and parsed[key].strip() for key in expected_keys
        ):
            raise ValueError("OpenRouter response did not match the report schema.")
        return {key: parsed[key].strip() for key in expected_keys}

    @staticmethod
    def _fallback(request: ReportRequest) -> ReportResponse:
        class_label = "No Tumor" if request.predicted_class == "notumor" else request.predicted_class.capitalize()
        confidence = f"{request.confidence * 100:.1f}%"
        probabilities = " | ".join(
            f"{'No Tumor' if name == 'notumor' else name.capitalize()}: {value * 100:.1f}%"
            for name, value in request.probabilities.items()
        )
        return ReportResponse(
            clinical_summary=(
                "The classifier evaluated the submitted MRI image. "
                f"Its highest-scoring class was {class_label} with a confidence of {confidence}. "
                f"Class probabilities: {probabilities}."
            ),
            impression=(
                f"Classifier output: {class_label} ({confidence} confidence). "
                "This statement reports the model output only and is not a diagnosis."
            ),
            recommendation=(
                "Use this classifier output only as decision-support information. "
                "A qualified clinician or radiologist should review the original images and the patient's clinical context."
            ),
            disclaimer=(
                "This automated classification does not establish a diagnosis and does not replace professional medical judgment."
            ),
            source="fallback",
        )
