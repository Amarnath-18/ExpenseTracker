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

# Install Tesseract system package
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*




CMD ["rq", "worker", "default", "--url", "redis://redis:6379/0"]
