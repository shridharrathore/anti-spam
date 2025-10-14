from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Sequence

from sqlalchemy import func, select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.call import Call
from app.models.message import Message
from app.models.sender import Sender


async def init_db() -> None:
    """Create tables and seed a compact dataset for the POC."""

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        message_count = await session.scalar(select(func.count(Message.id)))
        if message_count and message_count > 0:
            return

        senders = _seed_senders()
        session.add_all(senders)
        await session.flush()

        messages = _seed_messages(senders)
        calls = _seed_calls(senders)

        session.add_all(messages + calls)
        await session.commit()


def _seed_senders() -> list[Sender]:
    now = datetime.now(timezone.utc)
    return [
        Sender(phone_number="+1555001001", spam_count=42, last_seen=now),
        Sender(phone_number="+1555002002", spam_count=17, last_seen=now - timedelta(hours=2)),
        Sender(phone_number="+1555003003", spam_count=5, last_seen=now - timedelta(days=1)),
    ]


def _seed_messages(senders: Sequence[Sender]) -> list[Message]:
    now = datetime.now(timezone.utc)
    return [
        Message(
            sender=senders[0],
            receiver_number="+1555999000",
            body="Congratulations! You've won a cruise. Click the link to claim.",
            category="lottery",
            received_at=now - timedelta(hours=3),
            is_spam=True,
            confidence=0.98,
            blocked=True,
        ),
        Message(
            sender=senders[1],
            receiver_number="+1555888777",
            body="Last chance to refinance at 0.9%. Reply YES.",
            category="financial",
            received_at=now - timedelta(days=1, hours=4),
            is_spam=True,
            confidence=0.92,
            blocked=True,
        ),
        Message(
            sender=None,
            receiver_number="+1555777666",
            body="Two-factor code 123456. Do not share this code.",
            category="security",
            received_at=now - timedelta(hours=1),
            is_spam=False,
            confidence=0.05,
            blocked=False,
        ),
    ]


def _seed_calls(senders: Sequence[Sender]) -> list[Call]:
    now = datetime.now(timezone.utc)
    return [
        Call(
            caller=senders[0],
            callee_number="+1555666555",
            started_at=now - timedelta(days=2, hours=1),
            duration_seconds=120,
            category="marketing",
            is_spam=True,
            confidence=0.94,
            blocked=True,
        ),
        Call(
            caller=senders[1],
            callee_number="+1555444333",
            started_at=now - timedelta(hours=6),
            duration_seconds=45,
            category="scam",
            is_spam=True,
            confidence=0.88,
            blocked=False,
        ),
        Call(
            caller=None,
            callee_number="+1555222111",
            started_at=now - timedelta(hours=2),
            duration_seconds=300,
            category="support",
            is_spam=False,
            confidence=0.07,
            blocked=False,
        ),
    ]
