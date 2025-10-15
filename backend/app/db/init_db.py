from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Sequence


from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.call import Call
from app.models.message import Message
from app.models.sender import Sender


async def init_db() -> None:
    """Create tables and seed a richer demo dataset."""

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        senders = _seed_senders()
        session.add_all(senders)
        await session.flush()

        messages = _seed_messages(senders)
        calls = _seed_calls(senders)

        session.add_all(messages + calls)
        await session.commit()


def _seed_senders() -> list[Sender]:
    now = datetime.now(timezone.utc)
    specs = [
        ("+1555001001", 124, timedelta(minutes=5), True),
        ("+1555002002", 87, timedelta(hours=1), True),
        ("+1555003003", 58, timedelta(hours=6), False),
        ("+1555004004", 33, timedelta(days=1, hours=2), False),
        ("+1555005005", 22, timedelta(days=2), False),
        ("+1555006006", 19, timedelta(days=3, hours=5), False),
        ("+1555007007", 15, timedelta(days=4, hours=8), False),
        ("+1555008008", 9, timedelta(days=5), False)
    ]
    return [
        Sender(
            phone_number=phone,
            spam_count=spam_count,
            last_seen=now - last_seen_delta,
            is_blocked=is_blocked,
        )
        for phone, spam_count, last_seen_delta, is_blocked in specs
    ]


def _seed_messages(senders: Sequence[Sender]) -> list[Message]:
    now = datetime.now(timezone.utc)
    specs = [
        {
            "sender": senders[0],
            "receiver": "+1555999000",
            "body": "Congratulations! You've won a cruise. Click the link to claim.",
            "category": "lottery",
            "delta": timedelta(hours=3),
            "spam": True,
            "blocked": True,
            "confidence": 0.98,
        },
        {
            "sender": senders[1],
            "receiver": "+1555888777",
            "body": "Last chance to refinance at 0.9%. Reply YES.",
            "category": "financial",
            "delta": timedelta(days=1, hours=4),
            "spam": True,
            "blocked": True,
            "confidence": 0.92,
        },
        {
            "sender": senders[2],
            "receiver": "+1555777666",
            "body": "Two-factor code 123456. Do not share this code.",
            "category": "security",
            "delta": timedelta(hours=1),
            "spam": False,
            "blocked": False,
            "confidence": 0.05,
        },
        {
            "sender": senders[3],
            "receiver": "+1555333444",
            "body": "Limited time promo: upgrade to premium data today!",
            "category": "promotional",
            "delta": timedelta(days=2, hours=3),
            "spam": True,
            "blocked": True,
            "confidence": 0.82,
        },
        {
            "sender": senders[4],
            "receiver": "+1555666777",
            "body": "Claim your complimentary gift card at reward-zone.biz",
            "category": "phishing",
            "delta": timedelta(days=3, hours=6),
            "spam": True,
            "blocked": True,
            "confidence": 0.94,
        },
        {
            "sender": senders[5],
            "receiver": "+1555888999",
            "body": "Reminder: Your package delivery requires action. Pay customs fee now.",
            "category": "logistics",
            "delta": timedelta(days=4, hours=5),
            "spam": True,
            "blocked": False,
            "confidence": 0.77,
        },
        {
            "sender": senders[6],
            "receiver": "+1555000111",
            "body": "Payroll processed successfully. Reply HELP for support.",
            "category": "transactional",
            "delta": timedelta(days=2),
            "spam": False,
            "blocked": False,
            "confidence": 0.12,
        },
        {
            "sender": senders[7],
            "receiver": "+1555444222",
            "body": "You've won a cruise. Click the link to claim.",
            "category": "lottery",
            "delta": timedelta(days=1, hours=8),
            "spam": True,
            "blocked": True,
            "confidence": 0.96,
        },
        {
            "sender": senders[0],
            "receiver": "+1555333666",
            "body": "URGENT: Verify your bank account immediately to avoid closure.",
            "category": "financial",
            "delta": timedelta(hours=12),
            "spam": True,
            "blocked": True,
            "confidence": 0.93,
        },
        {
            "sender": None,
            "receiver": "+1555111222",
            "body": "System alert: Scheduled maintenance tonight 11PM-3AM.",
            "category": "system",
            "delta": timedelta(days=5, hours=2),
            "spam": False,
            "blocked": False,
            "confidence": 0.1,
        },
        {
            "sender": senders[2],
            "receiver": "+1555777555",
            "body": "Lottery payout pending. Submit bank details to receive funds.",
            "category": "lottery",
            "delta": timedelta(hours=7),
            "spam": True,
            "blocked": True,
            "confidence": 0.91,
        },
        {
            "sender": senders[4],
            "receiver": "+1555333777",
            "body": "Reminder: Call us back to extend your car warranty.",
            "category": "services",
            "delta": timedelta(days=6, hours=9),
            "spam": True,
            "blocked": False,
            "confidence": 0.74,
        },
        {
            "sender": senders[3],
            "receiver": "+1555999888",
            "body": "Two-factor code 654321. Do not share this code.",
            "category": "security",
            "delta": timedelta(hours=2),
            "spam": False,
            "blocked": False,
            "confidence": 0.04,
        },
    ]

    return [
        Message(
            sender=spec["sender"],
            receiver_number=spec["receiver"],
            body=spec["body"],
            category=spec["category"],
            received_at=now - spec["delta"],
            is_spam=spec["spam"],
            confidence=spec["confidence"],
            blocked=spec["blocked"],
        )
        for spec in specs
    ]


def _seed_calls(senders: Sequence[Sender]) -> list[Call]:
    now = datetime.now(timezone.utc)
    specs = [
        {
            "caller": senders[0],
            "callee": "+1555666555",
            "delta": timedelta(days=2, hours=1),
            "duration": 120,
            "category": "marketing",
            "spam": True,
            "blocked": True,
            "confidence": 0.94,
        },
        {
            "caller": senders[1],
            "callee": "+1555444333",
            "delta": timedelta(hours=6),
            "duration": 45,
            "category": "scam",
            "spam": True,
            "blocked": False,
            "confidence": 0.88,
        },
        {
            "caller": None,
            "callee": "+1555222111",
            "delta": timedelta(hours=2),
            "duration": 300,
            "category": "support",
            "spam": False,
            "blocked": False,
            "confidence": 0.07,
        },
        {
            "caller": senders[2],
            "callee": "+1555333111",
            "delta": timedelta(days=1, hours=5),
            "duration": 210,
            "category": "collections",
            "spam": True,
            "blocked": True,
            "confidence": 0.9,
        },
        {
            "caller": senders[3],
            "callee": "+1555888444",
            "delta": timedelta(days=3, hours=4),
            "duration": 60,
            "category": "telemarketing",
            "spam": True,
            "blocked": True,
            "confidence": 0.86,
        },
        {
            "caller": senders[4],
            "callee": "+1555777333",
            "delta": timedelta(days=4, hours=6),
            "duration": 35,
            "category": "scam",
            "spam": True,
            "blocked": False,
            "confidence": 0.8,
        },
        {
            "caller": senders[5],
            "callee": "+1555666444",
            "delta": timedelta(days=1, minutes=30),
            "duration": 15,
            "category": "survey",
            "spam": True,
            "blocked": False,
            "confidence": 0.7,
        },
        {
            "caller": senders[6],
            "callee": "+1555000222",
            "delta": timedelta(hours=10),
            "duration": 480,
            "category": "support",
            "spam": False,
            "blocked": False,
            "confidence": 0.11,
        },
        {
            "caller": senders[7],
            "callee": "+1555444000",
            "delta": timedelta(days=5, hours=3),
            "duration": 95,
            "category": "marketing",
            "spam": True,
            "blocked": True,
            "confidence": 0.89,
        },
        {
            "caller": senders[0],
            "callee": "+1555333555",
            "delta": timedelta(hours=18),
            "duration": 25,
            "category": "collections",
            "spam": True,
            "blocked": True,
            "confidence": 0.92,
        },
    ]

    return [
        Call(
            caller=spec["caller"],
            callee_number=spec["callee"],
            started_at=now - spec["delta"],
            duration_seconds=spec["duration"],
            category=spec["category"],
            is_spam=spec["spam"],
            confidence=spec["confidence"],
            blocked=spec["blocked"],
        )
        for spec in specs
    ]
