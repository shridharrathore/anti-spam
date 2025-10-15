from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.models.call import Call
from app.models.sender import Sender
from app.schemas.call import CallCategorySummary, CallListResponse, CallRead, CallStats

router = APIRouter()


@router.get("", response_model=CallListResponse)
async def list_calls(
    start_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive lower bound"),
    end_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive upper bound"),
    session: AsyncSession = Depends(get_session),
) -> CallListResponse:
    filters = _time_filters(Call.started_at, start_date, end_date)

    calls_result = await session.execute(
        select(Call)
        .options(selectinload(Call.caller))
        .where(*filters)
        .order_by(Call.started_at.desc())
    )
    calls = list(calls_result.scalars())

    stats = await _call_stats(session, filters)
    categories = _categorise_calls(calls)

    recent_calls = [
        CallRead(
            id=call.id,
            caller_id=call.caller_id,
            caller_number=call.caller.phone_number if call.caller else None,
            callee_number=call.callee_number,
            started_at=call.started_at,
            duration_seconds=call.duration_seconds,
            category=call.category,
            is_spam=call.is_spam,
            confidence=call.confidence,
            blocked=call.blocked,
            caller_is_blocked=call.caller.is_blocked if call.caller else False,
        )
        for call in calls
    ]

    return CallListResponse(
        stats=stats,
        categories=categories,
        recent_calls=recent_calls,
    )


async def _call_stats(session: AsyncSession, filters: tuple) -> CallStats:
    total_calls = await session.scalar(
        select(func.count(Call.id)).where(*filters)
    ) or 0
    blocked_calls = await session.scalar(
        select(func.count()).where(Call.blocked.is_(True), *filters)
    ) or 0
    unique_callers = await session.scalar(
        select(func.count(func.distinct(Call.caller_id))).where(
            Call.caller_id.is_not(None), *filters
        )
    ) or 0

    top_caller_number_result = await session.execute(
        select(Sender.phone_number)
        .join(Call, Sender.id == Call.caller_id)
        .where(*filters)
        .group_by(Sender.id)
        .order_by(func.count(Call.id).desc())
        .limit(1)
    )
    top_caller_number = top_caller_number_result.scalar_one_or_none()

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


def _categorise_calls(calls: list[Call]) -> list[CallCategorySummary]:
    grouped: dict[str, list[Call]] = {}
    for call in calls:
        category = call.category or "uncategorised"
        grouped.setdefault(category, []).append(call)

    summaries: list[CallCategorySummary] = []
    for category, entries in grouped.items():
        unique_callers = {entry.caller_id for entry in entries if entry.caller_id}
        blocked = sum(1 for entry in entries if entry.blocked)
        sample = entries[0]
        summaries.append(
            CallCategorySummary(
                category=category,
                total_calls=len(entries),
                unique_callers=len(unique_callers),
                blocked=blocked,
                sample_preview=f"Caller {sample.caller.phone_number if sample.caller else 'Unknown'}"
                f" → {sample.callee_number}",
            )
        )

    return sorted(
        summaries,
        key=lambda summary: summary.total_calls,
        reverse=True,
    )


def _time_filters(column, start_date: Optional[datetime], end_date: Optional[datetime]) -> tuple:
    conditions = []
    if start_date:
        conditions.append(column >= start_date)
    if end_date:
        conditions.append(column <= end_date)
    return tuple(conditions)
