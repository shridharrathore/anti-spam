from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CallRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caller_id: Optional[int]
    caller_number: Optional[str]
    callee_number: str
    started_at: datetime
    duration_seconds: int
    category: Optional[str]
    is_spam: bool
    confidence: Optional[float]
    blocked: bool
    caller_is_blocked: bool


class CallCategorySummary(BaseModel):
    category: str
    total_calls: int
    unique_callers: int
    blocked: int
    sample_preview: str


class CallStats(BaseModel):
    total_calls: int
    blocked_calls: int
    unique_callers: int
    spam_percentage: float
    top_caller_number: Optional[str]


class CallListResponse(BaseModel):
    stats: CallStats
    categories: list[CallCategorySummary]
    recent_calls: list[CallRead]
