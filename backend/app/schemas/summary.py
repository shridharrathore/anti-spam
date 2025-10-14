from pydantic import BaseModel

from app.schemas.call import CallStats
from app.schemas.message import MessageStats


class DashboardSummary(BaseModel):
    timeframe: str
    sms: MessageStats
    calls: CallStats
    overall_block_rate: float
    avg_confidence: float
