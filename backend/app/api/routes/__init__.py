from fastapi import APIRouter

from app.api.routes import calls, classification, senders, sms, summary

router = APIRouter()
router.include_router(summary.router, prefix="/summary", tags=["summary"])
router.include_router(sms.router, prefix="/sms", tags=["sms"])
router.include_router(calls.router, prefix="/calls", tags=["calls"])
router.include_router(classification.router, prefix="/classification", tags=["classification"])
router.include_router(senders.router, prefix="/senders", tags=["senders"])
