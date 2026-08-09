from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool


class PredictionResponse(BaseModel):
    predicted_class: str
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: dict[str, float]


class PatientDetails(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    gender: str = Field(min_length=1, max_length=80)
    dob: str = Field(min_length=1, max_length=40)
    phone: str = Field(min_length=1, max_length=80)
    doctor: str = Field(min_length=1, max_length=200)
    notes: str = Field(min_length=1, max_length=2_000)


class ReportRequest(BaseModel):
    patient: PatientDetails
    predicted_class: Literal["glioma", "meningioma", "notumor", "pituitary"]
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: dict[str, float] = Field(min_length=4, max_length=4)


class ReportResponse(BaseModel):
    clinical_summary: str
    impression: str
    recommendation: str
    disclaimer: str
    source: Literal["ai", "fallback"]
