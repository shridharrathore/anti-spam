from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.models.message import Message
from app.models.sender import Sender
from app.schemas.message import (
    MessageCategorySummary,
    MessageRead,
    MessageStats,
    SmsListResponse,
)

router = APIRouter()


@router.get("", response_model=SmsListResponse)
async def list_sms(
    start_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive lower bound"),
    end_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive upper bound"),
    session: AsyncSession = Depends(get_session),
) -> SmsListResponse:
    filters = _time_filters(Message.received_at, start_date, end_date)

    messages_result = await session.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(*filters)
        .order_by(Message.received_at.desc())
    )
    messages = list(messages_result.scalars())

    stats = await _message_stats(session, filters)
    categories = _categorise_messages(messages)

    recent_messages = [
        MessageRead(
            id=message.id,
            sender_id=message.sender_id,
            sender_number=message.sender.phone_number if message.sender else None,
            receiver_number=message.receiver_number,
            body=message.body,
            category=message.category,
            received_at=message.received_at,
            is_spam=message.is_spam,
            confidence=message.confidence,
            blocked=message.blocked,
            sender_is_blocked=message.sender.is_blocked if message.sender else False,
        )
        for message in messages
    ]

    return SmsListResponse(
        stats=stats,
        categories=categories,
        recent_messages=recent_messages,
    )


async def _message_stats(session: AsyncSession, filters: tuple) -> MessageStats:
    total_messages = await session.scalar(
        select(func.count(Message.id)).where(*filters)
    ) or 0
    blocked_messages = await session.scalar(
        select(func.count()).where(Message.blocked.is_(True), *filters)
    ) or 0
    unique_senders = await session.scalar(
        select(func.count(func.distinct(Message.sender_id))).where(
            Message.sender_id.is_not(None), *filters
        )
    ) or 0

    top_sender_number_result = await session.execute(
        select(Sender.phone_number)
        .join(Message, Sender.id == Message.sender_id)
        .where(*filters)
        .group_by(Sender.id)
        .order_by(func.count(Message.id).desc())
        .limit(1)
    )
    top_sender_number = top_sender_number_result.scalar_one_or_none()

    spam_percentage = (
        blocked_messages / total_messages if total_messages else 0.0
    )

    return MessageStats(
        total_messages=total_messages,
        blocked_messages=blocked_messages,
        unique_senders=unique_senders,
        spam_percentage=round(spam_percentage, 3),
        top_sender_number=top_sender_number,
    )


def _categorise_messages(messages: list[Message]) -> list[MessageCategorySummary]:
    grouped: dict[str, list[Message]] = {}
    for message in messages:
        category = message.category or "uncategorised"
        grouped.setdefault(category, []).append(message)

    summaries: list[MessageCategorySummary] = []
    for category, entries in grouped.items():
        unique_senders = {entry.sender_id for entry in entries if entry.sender_id}
        blocked = sum(1 for entry in entries if entry.blocked)
        unique_messages = {entry.body.strip() for entry in entries}
        summaries.append(
            MessageCategorySummary(
                category=category,
                total_messages=len(entries),
                unique_senders=len(unique_senders),
                blocked=blocked,
                sample_preview=entries[0].body[:120],
                unique_messages=len(unique_messages),
            )
        )

    return sorted(
        summaries,
        key=lambda summary: summary.total_messages,
        reverse=True,
    )


def _time_filters(column, start_date: Optional[datetime], end_date: Optional[datetime]) -> tuple:
    conditions = []
    if start_date:
        conditions.append(column >= start_date)
    if end_date:
        conditions.append(column <= end_date)
    return tuple(conditions)
