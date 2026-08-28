# 💰 ExpenseTracker Backend

A modern, production-ready FastAPI backend designed to track expenses. It accepts transaction/receipt screenshots, extracts text locally using **PaddleOCR**, structures the raw receipt data using **LangChain** (supporting both local Ollama models and cloud Gemini models), and stores the finalized transaction in **PostgreSQL**.

---

## 🚀 Key Features

* 📸 **Receipt OCR Scanner**: High-accuracy local text extraction from images using PaddleOCR.
* 🤖 **Smart AI Structuring (LangChain)**: Extract structured details (merchant, amount, currency, category, date, payment mode) using Google Gemini or local Ollama models (e.g., Llama 3.2).
* 🔐 **Secure Authentication**: Complete JWT-based user authentication, token refresh, and multi-device session management.
* 🛡️ **Production-Ready MVC Architecture**: Clean division of concerns across API Routes, Controllers, Services, SQLAlchemy Models, and Pydantic Schemas.
* 📊 **Robust PostgreSQL Storage**: Timezone-aware created timestamps, UUID/GUID primary keys, and automatic Alembic migrations.
* 🧪 **Fast Automated Test Suite**: Fully mocked unit and integration tests for fast execution (<1 sec) without network or hardware overhead.

---

## 📁 Project Structure

```text
backend/
├── alembic/                # Database migrations history and configurations
├── app/
│   ├── api/v1/             # Route endpoints (FastAPI routers)
│   ├── controllers/        # Request validation and business flow orchestration
│   ├── core/               # Application configuration settings (.env loading)
│   ├── db/                 # Database base class and session engine
│   ├── models/             # SQLAlchemy database models
│   ├── schemas/            # Pydantic schemas (Request/Response validation)
│   └── services/           # Core business logic (OCR scanner & LLM structuring)
├── tests/                  # Integration and unit tests
├── main.py                 # Server startup entrypoint
├── requirements.txt        # Python dependency manifest
└── Context.md              # Live project status and developer notes
```

---

## 🛠️ Setup & Installation

### Prerequisite
Ensure you have Python 3.10+ installed. Using **`uv`** is recommended for extremely fast dependency installation.

### 1. Clone the repository and navigate to backend
```powershell
cd backend
```

### 2. Create and activate a Virtual Environment
```powershell
# Using uv (Recommended)
uv venv
.venv\Scripts\Activate.ps1

# Using standard virtualenv
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies
```powershell
uv pip install -r requirements.txt
# OR
pip install -r requirements.txt
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure your credentials:
```powershell
cp .env.example .env
```

### Environment Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_APP_NAME` | Name of the FastAPI application | `"ExpanceTracker API"` |
| `APP_DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `APP_LLM_PROVIDER` | AI provider (`google` or `ollama`) | `ollama` |
| `APP_LLM_MODEL` | AI model name (`gemini-3.1-flash-lite` or `llama3.2`) | `llama3.2` |
| `APP_GEMINI_API_KEY` | API Key for Google Gemini (if using `google` provider) | `None` |
| `APP_OLLAMA_BASE_URL` | Local API URL for Ollama | `http://localhost:11434` |

---

## 🗄️ Database Migrations

Apply database migrations using Alembic:
```powershell
# Generate initial migration script
.\.venv\Scripts\alembic.exe revision --autogenerate -m "initial migration"

# Apply migrations to database
.\.venv\Scripts\alembic.exe upgrade head
```

---

## 🐳 Docker Deployment

The easiest way to run the backend is via Docker:

```powershell
# Build the image
docker build -t expancetracker-backend .

# Run the container
docker run -p 8000:8000 --env-file .env expancetracker-backend
```

---

## 🏃 Running the Application (Local)

### 1. Run local LLM service (Ollama)
Ensure Ollama is installed and run Llama 3.2 locally:
```powershell
ollama run llama3.2
```

### 2. Start the FastAPI backend
Run the backend with UTF-8 encoding support enabled on Windows:
```powershell
$env:PYTHONIOENCODING="utf-8"
fastapi dev main.py
```
Open **`http://127.0.0.1:8000/docs`** to access the Swagger interactive documentation.

### 3. Run Tests
```powershell
.\.venv\Scripts\pytest.exe
```

---

## 📊 Current Progress & Roadmap

- [x] Create MVC folder structure
- [x] Implement PaddleOCR local text extraction service
- [x] Configure PostgreSQL, UUID primary keys, and Alembic migrations
- [x] Implement LangChain AI structuring service (Gemini + Ollama)
- [x] Connect OCR + AI into a unified transaction upload API (`POST /api/v1/transactions/upload`)
- [x] Implement comprehensive Transaction CRUD operations
- [x] Add comprehensive mocked unit testing suite
- [x] Implement user authentication and multi-user tenancy
- [ ] Build Frontend React/Next.js dashboard application
- [ ] Connect frontend file-uploader to backend transaction API
