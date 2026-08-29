from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine
from app.api.v1.router import api_router
from app.core.config import settings
import app.models  # Ensures all models and relationships are registered

@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Manage the application lifecycle events.

    - Startup: Creates all database tables defined in SQLAlchemy models if they do not already exist.
    - Runtime: Yields control back to FastAPI to serve incoming requests.
    - Shutdown: Executes cleanup logic (e.g., closing database connections) when the server stops.
    """
    # Startup tasks
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Shutdown tasks (optional cleanup goes here)



def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_application()