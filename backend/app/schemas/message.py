from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: Optional[int]
    sender_number: Optional[str]
    receiver_number: str
    body: str
    category: Optional[str]
    received_at: datetime
    is_spam: bool
    confidence: Optional[float]
    blocked: bool
    sender_is_blocked: bool


class MessageCategorySummary(BaseModel):
    category: str
    total_messages: int
    unique_senders: int
    blocked: int
    sample_preview: str
    unique_messages: int


class MessageStats(BaseModel):
    total_messages: int
    blocked_messages: int
    unique_senders: int
    spam_percentage: float
    top_sender_number: Optional[str]


class SmsListResponse(BaseModel):
    stats: MessageStats
    categories: list[MessageCategorySummary]
    recent_messages: list[MessageRead]
