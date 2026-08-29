FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install system packages (Tesseract for OCR)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

# Set up entrypoint script for automatic migrations
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
