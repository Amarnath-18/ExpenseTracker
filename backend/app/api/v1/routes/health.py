from fastapi import APIRouter

from app.controllers.health_controller import get_health_status
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return get_health_status()
