from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.call import CallStats
from app.schemas.message import MessageStats


class DashboardSummary(BaseModel):
    timeframe: str
    sms: MessageStats
    calls: CallStats
    overall_block_rate: float
    avg_confidence: float
    sms_unique_spam_messages: int
    sms_unique_blocked_messages: int
    sms_daily: list["SmsDailyStat"]


class SmsDailyStat(BaseModel):
    date: date
    detected: int
    blocked: int
