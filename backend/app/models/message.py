from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender_id: Mapped[Optional[int]] = mapped_column(ForeignKey("senders.id"), nullable=True)
    receiver_number: Mapped[str] = mapped_column(String(32))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(64))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_spam: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False)

    sender: Mapped[Optional["Sender"]] = relationship("Sender", back_populates="messages")
