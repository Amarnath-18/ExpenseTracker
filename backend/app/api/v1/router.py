from fastapi import APIRouter

from app.api.v1.routes import expenses, health, ocr, transactions

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(ocr.router, prefix="/ocr",tags=["ocr"])
api_router.include_router(
    transactions.router, prefix="/transactions", tags=["transactions"]
)