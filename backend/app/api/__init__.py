from fastapi import APIRouter

from app.api.routes import router as routes_router

router = APIRouter()
router.include_router(routes_router, prefix="/api")


@router.get("/api/ping", tags=["health"])
async def ping() -> dict[str, str]:
    return {"message": "pong"}
