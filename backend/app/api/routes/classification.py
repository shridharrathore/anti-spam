from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas.classification import ClassificationRequest, ClassificationResponse
from app.services.classifier import classify_message

router = APIRouter()


@router.post("", response_model=ClassificationResponse)
async def classify_text(payload: ClassificationRequest) -> ClassificationResponse:
    try:
        return await classify_message(payload.text)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM classification unavailable: ensure OpenAI credentials are valid.",
        ) from exc
