from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Sender(Base):
    __tablename__ = "senders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    spam_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["Message"]] = relationship("Message", back_populates="sender")
    calls: Mapped[list["Call"]] = relationship("Call", back_populates="caller")


from app.models.message import Message  # noqa: E402  circular import resolution
from app.models.call import Call  # noqa: E402
