from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.sender import Sender
from app.schemas.sender import SenderRead

router = APIRouter(prefix="/senders", tags=["senders"])


@router.post("/{sender_id}/block", response_model=SenderRead)
async def block_sender(
    sender_id: int,
    session: AsyncSession = Depends(get_session),
) -> SenderRead:
    sender = await session.get(Sender, sender_id)
    if sender is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender not found")

    sender.is_blocked = True
    await session.commit()
    await session.refresh(sender)
    return sender


@router.post("/{sender_id}/unblock", response_model=SenderRead)
async def unblock_sender(
    sender_id: int,
    session: AsyncSession = Depends(get_session),
) -> SenderRead:
    sender = await session.get(Sender, sender_id)
    if sender is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender not found")

    sender.is_blocked = False
    await session.commit()
    await session.refresh(sender)
    return sender
