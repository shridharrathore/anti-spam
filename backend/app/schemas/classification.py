from pydantic import BaseModel, Field


class ClassificationRequest(BaseModel):
    text: str = Field(min_length=5, max_length=2000)


class ClassificationResponse(BaseModel):
    is_spam: bool
    confidence: float
    category: str
    rationale: str
