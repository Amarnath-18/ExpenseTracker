# ExpanceTracker Backend - Context File

This file maintains the current state, architecture, and roadmap of the Expense Tracker application to optimize context management for developers and AI agents.

---

## 🏗️ Project Architecture (MVC Blueprint)

The backend follows an MVC-style layering:
* **`app/api/`**: FastAPI route endpoints.
* **`app/controllers/`**: Orchestrates validation, services, and db transaction logic.
* **`app/services/`**: Holds core business logic (OCR processing, future LLM parsing).
* **`app/models/`**: SQLAlchemy database models.
* **`app/schemas/`**: Pydantic schemas for request validation & API responses.
* **`app/db/`**: Connection engine and session configuration.

---

## 🗄️ Database Models & State

We use **PostgreSQL** (with SQLite fallback) managed via **Alembic** migrations.

### `Transaction` Model (`app/models/transaction.py`)
Used to store fully detailed transaction info (created from manual entry or OCR scan).
* `id` (`uuid.UUID`): Primary key (GUID, indexed).
* `merchant` (`str | None`): Store/merchant name.
* `amount` (`Decimal`): Cost of transaction.
* `currency` (`str`): Currency of transaction (Default: `"INR"`).
* `category` (`str | None`): Category (e.g., `"Food"`, `"Travel"`).
* `date` (`date`): Transaction date (Default: `today`).
* `payment_method` (`str | None`): Payment mode (e.g., `"UPI"`, `"Cash"`).
* `raw_ocr_text` (`str | None`): Original raw text extracted from the receipt.
* `created_at` (`datetime`): Timezone-aware creation timestamp (Default: `UTC now`).

---

## 🔌 API Endpoints

| Method | Path | Description | Response Schema |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/health` | API Health Check | `{"status": "ok"}` |
| **POST** | `/api/v1/ocr/extract` | Upload receipt image -> run PaddleOCR -> return lines | `OCRResponse` |
| **GET** | `/api/v1/transactions/` | Get list of all transactions | `TransactionListResponse` |
| **POST** | `/api/v1/transactions/` | Manually insert a transaction | `TransactionResponse` |
| **GET** | `/api/v1/expenses/` | (Legacy) Get list of all legacy expenses | `ExpenseListResponse` |
| **POST** | `/api/v1/expenses/` | (Legacy) Manually insert a legacy expense | `ExpenseResponse` |

---

## ⚙️ How to Run & Key Commands

Run these commands inside the `backend/` directory:

### Running Migrations (Alembic)
Whenever you modify database models, generate and apply migrations:
```powershell
.\.venv\Scripts\alembic.exe revision --autogenerate -m "describe changes"
.\.venv\Scripts\alembic.exe upgrade head
```

### Starting the Server
To start the FastAPI dev server with UTF-8 console output support on Windows:
```powershell
fastapi dev main.py
```

### Running Tests
```powershell
.\.venv\Scripts\pytest.exe
```

---

## 🗺️ Next Steps (Roadmap)

1. **Phase 2: LLM Structuring Service (`app/services/llm_service.py`)**
   * Use **LangChain** with Pydantic output parsing.
   * Send the raw OCR text to an LLM (e.g., Google Gemini or OpenAI).
   * Receive a clean structured JSON mapping matching the `TransactionCreate` schema.

2. **Phase 3: Unified Transaction Endpoint (`POST /api/v1/transactions/upload`)**
   * Upload an image.
   * Extract raw text with OCR.
   * Send text to LLM to structure.
   * Save the structured transaction directly into PostgreSQL database.
