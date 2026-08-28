# ExpanceTracker Agent Notes

## Project Overview

- Workspace root: `D:\codes\ExpanceTracker`
- Main backend folder: `D:\codes\ExpanceTracker\backend`
- Backend stack: FastAPI, SQLAlchemy, Pydantic, PostgreSQL, PaddleOCR, LangChain
- Goal: build a learning-friendly expense tracker backend that can accept transaction screenshots, extract text with OCR, structure that text with a small model, and save a transaction for a user

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
- `app/controllers/...`: request and response orchestration (handles try-catch, formatting response, and clean HTTP exceptions)
- `app/services/...`: business logic and direct database writes (handles db session rollbacks and logging)
- `app/models/...`: SQLAlchemy models
- `app/schemas/...`: Pydantic request and response schemas
- `app/db/...`: engine, sessions, and database base class
- `app/core/config.py`: application settings from environment variables

## Environment Conventions

- Use `backend/.venv` as the main backend virtual environment
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
  - `langchain`
  - `langchain-core`
  - `langchain-google-genai`
  - `langchain-ollama`
  - `alembic`

Useful commands from `backend/`:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
fastapi dev main.py
pytest
```

## Database Notes

- PostgreSQL is the database, with SQLite fallback in settings for cases where `.env` is not loaded
- Connection string format in `.env`:
  ```env
  APP_DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/db_name
  ```
- Managed via Alembic migrations. Important commands from `backend/`:
  ```powershell
  .\.venv\Scripts\alembic.exe revision --autogenerate -m "describe changes"
  .\.venv\Scripts\alembic.exe upgrade head
  ```
- Important rule: SQLAlchemy models must be imported in `app/db/base.py` (or similar registered module) before running metadata checks so Alembic or `Base.metadata.create_all` registers the tables.

## Important Current Files

- `backend/main.py`: entrypoint that imports `app.main`
- `backend/app/main.py`: FastAPI app factory and startup/lifespan logic
- `backend/app/api/v1/router.py`: API router registration
- `backend/app/models/expense.py` & `transaction.py`: Expense and Transaction models
- `backend/app/schemas/expense.py` & `transaction.py`: Pydantic schemas (includes transaction delete response model)
- `backend/app/services/expense_service.py` & `transaction_service.py`: Service layers wrapping SQL queries
- `backend/app/services/ocr_service.py`: Image OCR scanning engine using PaddleOCR
- `backend/app/services/llm_service.py`: Structured transaction extractor utilizing LangChain (Gemini/Ollama)
- `backend/app/controllers/expense_controller.py` & `transaction_controller.py`: Controllers orchestrating logic and exceptions
- `backend/app/api/v1/routes/expenses.py` & `transactions.py`: FastAPI endpoints

## API Endpoint Blueprint

| Method | Path | Description | Response Schema |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/health` | API Health Check | `HealthResponse` |
| **POST** | `/api/v1/ocr/extract` | Upload receipt image -> run PaddleOCR -> return lines | `OCRResponse` |
| **GET** | `/api/v1/transactions/` | Get list of all transactions | `TransactionListResponse` |
| **POST** | `/api/v1/transactions/` | Manually insert a transaction | `TransactionResponse` |
| **POST** | `/api/v1/transactions/upload` | Upload receipt -> OCR scan -> LLM parse -> DB save | `TransactionResponse` |
| **DELETE** | `/api/v1/transactions/{id}` | Delete transaction by its ID | `TransactionDeleteResponse` |
| **GET** | `/api/v1/expenses/` | (Legacy) Get list of all legacy expenses | `ExpenseListResponse` |
| **POST** | `/api/v1/expenses/` | (Legacy) Manually insert a legacy expense | `ExpenseResponse` |

## Production Best Practices Implemented

- **Try-Catch Block Pattern**: All controllers wrap database queries and external service (OCR/LLM) invocations inside try-except blocks, ensuring custom API response handling (e.g. 500 server errors instead of raw exceptions).
- **Session Rollback**: The services wrap write queries in try-catch blocks and run `db.rollback()` on exceptions to guarantee database state consistency.
- **Clean Logging**: Added warning, info, and error logging configuration at controller and service boundaries.

## Working Style

- Prefer step-by-step guidance over large automatic rewrites
- Keep explanations grounded in the current project files
- Build features following the existing MVC-style structure
