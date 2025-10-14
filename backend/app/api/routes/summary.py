from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.call import Call
from app.models.message import Message
from app.models.sender import Sender
from app.schemas.call import CallStats
from app.schemas.message import MessageStats
from app.schemas.summary import DashboardSummary

router = APIRouter()


@router.get("", response_model=DashboardSummary)
async def get_dashboard_summary(
    session: AsyncSession = Depends(get_session),
) -> DashboardSummary:
    sms_stats = await _message_stats(session)
    call_stats = await _call_stats(session)

    total_events = sms_stats.total_messages + call_stats.total_calls
    total_blocked = sms_stats.blocked_messages + call_stats.blocked_calls
    overall_block_rate = (total_blocked / total_events) if total_events else 0.0
    avg_confidence = await _average_confidence(session)

    return DashboardSummary(
        timeframe="last_7_days",
        sms=sms_stats,
        calls=call_stats,
        overall_block_rate=round(overall_block_rate, 3),
        avg_confidence=round(avg_confidence, 3),
    )


async def _message_stats(session: AsyncSession) -> MessageStats:
    total_messages = await session.scalar(select(func.count(Message.id))) or 0
    blocked_messages = await session.scalar(
        select(func.count()).where(Message.blocked.is_(True))
    ) or 0
    unique_senders = await session.scalar(
        select(func.count(func.distinct(Message.sender_id))).where(Message.sender_id.is_not(None))
    ) or 0

    top_sender_number = await _top_sender_number(session, "messages")

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


async def _call_stats(session: AsyncSession) -> CallStats:
    total_calls = await session.scalar(select(func.count(Call.id))) or 0
    blocked_calls = await session.scalar(
        select(func.count()).where(Call.blocked.is_(True))
    ) or 0
    unique_callers = await session.scalar(
        select(func.count(func.distinct(Call.caller_id))).where(Call.caller_id.is_not(None))
    ) or 0

    top_caller_number = await _top_sender_number(session, "calls")

    spam_percentage = (
        blocked_calls / total_calls if total_calls else 0.0
    )

    return CallStats(
        total_calls=total_calls,
        blocked_calls=blocked_calls,
        unique_callers=unique_callers,
        spam_percentage=round(spam_percentage, 3),
        top_caller_number=top_caller_number,
    )


async def _top_sender_number(session: AsyncSession, entity: str) -> str | None:
    if entity == "messages":
        query = (
            select(Sender.phone_number)
            .join(Message, Sender.id == Message.sender_id)
            .group_by(Sender.id)
            .order_by(func.count(Message.id).desc())
        )
    else:
        query = (
            select(Sender.phone_number)
            .join(Call, Sender.id == Call.caller_id)
            .group_by(Sender.id)
            .order_by(func.count(Call.id).desc())
        )

    result = await session.execute(query.limit(1))
    return result.scalar_one_or_none()


async def _average_confidence(session: AsyncSession) -> float:
    message_avg = await session.scalar(
        select(func.avg(Message.confidence)).where(Message.confidence.is_not(None))
    )
    call_avg = await session.scalar(
        select(func.avg(Call.confidence)).where(Call.confidence.is_not(None))
    )
    confidences = [value for value in [message_avg, call_avg] if value is not None]
    if not confidences:
        return 0.0
    return sum(confidences) / len(confidences)
