from __future__ import annotations

import json
import logging
from typing import Optional

from openai import AsyncOpenAI
from openai._exceptions import OpenAIError

from app.core.config import get_settings
from app.schemas.classification import ClassificationResponse

logger = logging.getLogger(__name__)


async def classify_message(text: str) -> ClassificationResponse:
    """Classify text using OpenAI; raise if the model cannot be reached."""

    result = await _classify_with_openai(text)
    if result is None:
        raise RuntimeError("OpenAI classification unavailable")
    return result


async def _classify_with_openai(text: str) -> Optional[ClassificationResponse]:
    settings = get_settings()
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not configured; cannot classify message")
        return None

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    system_prompt = (
        "You are a telecom compliance assistant. Process the provided message and respond with "
        "a JSON object containing: is_spam (boolean), confidence (number 0-1), category (string), "
        "and rationale (string). Confidence must be a number between 0 and 1."
    )

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Classify the following message:\n{text}"},
            ],
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_output_tokens,
            response_format={"type": "json_object"},
        )
    except OpenAIError as exc:  # pragma: no cover - depends on network
        logger.error("OpenAI classification failed: %s", exc)
        return None
    except Exception as exc:  # pragma: no cover - defensive catch
        logger.error("Unexpected error calling OpenAI: %s", exc)
        return None

    try:
        content = response.choices[0].message.content or ""
    except (AttributeError, IndexError) as exc:  # pragma: no cover - defensive
        logger.error("Malformed OpenAI response: %s", exc)
        return None

    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("Failed to decode OpenAI response: %s", exc)
        return None

    try:
        confidence = float(payload.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(confidence, 1.0))

    is_spam = bool(payload.get("is_spam", False))
    category = str(payload.get("category", "unknown"))
    rationale = str(payload.get("rationale", "")) or "LLM did not provide a rationale."

    return ClassificationResponse(
        is_spam=is_spam,
        confidence=confidence,
        category=category,
        rationale=rationale,
    )
