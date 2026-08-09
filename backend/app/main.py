from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import (
    ALLOWED_MEDIA_TYPES,
    CLASS_LABELS_PATH,
    MAX_UPLOAD_BYTES,
    MODEL_PATH,
)
from app.schemas.prediction import HealthResponse, PredictionResponse, ReportRequest, ReportResponse
from app.services.image_processing import decode_image
from app.services.inference import InferenceService
from app.services.report_generator import ReportGenerator


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.is_file():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    logger.info("Loading VGG16 model from %s", MODEL_PATH)
    app.state.inference_service = InferenceService(MODEL_PATH, CLASS_LABELS_PATH)
    app.state.report_generator = ReportGenerator()
    logger.info("VGG16 model loaded")
    try:
        yield
    finally:
        await app.state.report_generator.close()


app = FastAPI(
    title="Brain MRI Classification API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    """Describe the API entry point for browser visitors."""
    return {
        "message": "Brain MRI Classification API is running.",
        "health": "/health",
        "documentation": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    return HealthResponse(model_loaded=hasattr(request.app.state, "inference_service"))


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: Request, image: UploadFile = File(...)) -> PredictionResponse:
    if image.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Content type must be image/jpeg or image/png.",
        )

    image_bytes = await image.read(MAX_UPLOAD_BYTES + 1)
    await image.close()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded image is empty.",
        )
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the 25 MB upload limit.",
        )

    image_array = decode_image(image_bytes)
    predicted_class, confidence, probabilities = request.app.state.inference_service.predict(
        image_array
    )
    return PredictionResponse(
        predicted_class=predicted_class,
        confidence=confidence,
        probabilities=probabilities,
    )


@app.post("/generate-report", response_model=ReportResponse)
async def generate_report(request: Request, report_request: ReportRequest) -> ReportResponse:
    """Create a text-only report from patient details and classifier output."""
    return await request.app.state.report_generator.generate(report_request)
