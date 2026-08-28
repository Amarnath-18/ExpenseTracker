# ===================================================
# Stage 1: API (Lightweight, fast build)
# ===================================================
FROM python:3.12-slim AS api

WORKDIR /app

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]

# ===================================================
# Stage 2: Worker (ML / OCR / LLM background worker)
# ===================================================
FROM api AS worker

# Install system libraries needed by OpenCV / PaddleOCR / PaddlePaddle
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-worker.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-worker.txt

CMD ["celery", "-A", "app.core.celery_app.celery_app", "worker", "--loglevel=info"]