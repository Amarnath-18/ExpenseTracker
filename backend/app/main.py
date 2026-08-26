from contextlib import asynccontextmanager
from app.db.base import Base
from fastapi import FastAPI
from app.db.session import engine
from app.api.v1.router import api_router
from app.core.config import settings
from fastapi.openapi.docs import get_swagger_ui_html


from contextlib import asynccontextmanager
from fastapi import FastAPI

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
        lifespan=lifespan,
        docs_url=None
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_application()

# 2. Add custom docs route with dark theme CSS
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI (Dark)",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-newspaper.css"
    )