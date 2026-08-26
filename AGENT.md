# ExpanceTracker Agent Notes

## Project Overview

- Workspace root: `D:\codes\ExpanceTracker`
- Main backend folder: `D:\codes\ExpanceTracker\backend`
- Backend stack: FastAPI, SQLAlchemy, Pydantic, PostgreSQL, PaddleOCR
- Goal: build a learning-friendly expense tracker backend that can later accept transaction screenshots, extract text with OCR, structure that text with a small model, and save a transaction for a user

## Current Backend Structure

```text
backend/
  app/
    api/v1/routes/
    controllers/
    core/
    db/
    models/
    schemas/
    services/
  tests/
  main.py
  requirements.txt
```

Layer responsibilities:

- `app/api/...`: FastAPI route definitions
- `app/controllers/...`: request and response orchestration
- `app/services/...`: business logic
- `app/models/...`: SQLAlchemy models
- `app/schemas/...`: Pydantic request and response schemas
- `app/db/...`: engine, sessions, and database base class
- `app/core/config.py`: application settings from environment variables

## Environment Conventions

- Use `backend/.venv` as the main backend virtual environment
- The old OCR sandbox environment `backend/.venv-ocr` was removed
- Install backend dependencies from `backend/requirements.txt`
- Current requirements include:
  - `fastapi[standard]`
  - `pydantic-settings`
  - `pytest`
  - `sqlalchemy`
  - `psycopg`
  - `psycopg[binary]`
  - `paddlepaddle`
  - `paddleocr`

Useful commands from `backend/`:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
fastapi dev main.py
pytest
```

## Database Notes

- PostgreSQL is the intended database
- The discussed connection string format is:

```env
APP_DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/db_name
```

- The app also has a SQLite fallback in settings for cases where `.env` is not being loaded
- A previous issue was caused by tables not being created before use
- Important rule: SQLAlchemy models must be imported before `Base.metadata.create_all(bind=engine)` so metadata includes those tables

## Important Current Files

- `backend/main.py`: entrypoint that imports `app.main`
- `backend/app/main.py`: FastAPI app factory and startup/lifespan logic
- `backend/app/api/v1/router.py`: API router registration
- `backend/app/models/expense.py`: current expense model
- `backend/app/services/expense_service.py`: example service pattern
- `backend/app/controllers/expense_controller.py`: example controller pattern
- `backend/app/api/v1/routes/expenses.py`: example route pattern
- `backend/ocr_test.py`: working local PaddleOCR experiment

## OCR Status

- PaddleOCR worked successfully in the earlier prototype test
- The Windows workaround used in the OCR test was:
  - `os.environ["FLAGS_enable_pir_api"] = "0"`
  - `enable_mkldnn=False`
- The sample OCR test successfully detected text from `backend/text-image.png`

## Planned OCR Flow

Target product flow:

1. User uploads a transaction screenshot through an API
2. OCR extracts raw text from the image
3. A small text-to-text model structures the OCR text
4. The structured transaction is saved to the database for that user

For now, only the OCR extraction API is in scope.

## Next API To Build

Create an OCR extraction endpoint:

- Method: `POST`
- Path: `/api/v1/ocr/extract`

Initial behavior:

- accept an uploaded image
- save it temporarily
- run OCR
- return extracted text as JSON
- do not store in the database yet
- do not call the formatting model yet

Recommended files for this feature:

- `app/schemas/ocr.py`
- `app/services/ocr_service.py`
- `app/controllers/ocr_controller.py`
- `app/api/v1/routes/ocr.py`

Suggested response shape:

```json
{
  "extracted_text": "Paid to Rahul 250 UPI",
  "lines": ["Paid to Rahul", "250", "UPI"]
}
```

## Working Style

- Prefer step-by-step guidance over large automatic rewrites
- Keep explanations grounded in the current project files
- Build features following the existing MVC-style structure used by the expense endpoints
