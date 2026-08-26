from fastapi import APIRouter

from app.api.v1.routes import expenses, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
