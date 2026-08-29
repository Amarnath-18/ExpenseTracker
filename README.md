# ⚡ SpendPulse (ExpenseTracker)

A full-stack, AI-powered personal finance and receipt scanning system.

* **📱 Mobile App (`application/`)**: Built with **React Native & Expo SDK 54**, featuring a modern dark glassmorphic design system, OTP verification, instant receipt scanning, and automated cloud APK builds via **EAS Build**.
* **🚀 Backend (`backend/`)**: High-performance **FastAPI** service accepting receipt images, extracting text locally with **PaddleOCR**, structuring data with **LangChain** (Google Gemini & Ollama), and storing records in **PostgreSQL**.
* **🌐 Web Preview (`minimal_UI/`)**: Lightweight web interface for quick API testing.

---

## 📱 Mobile Application (`application/`)

### Key Features
* 💎 **Dark Glassmorphic UI**: High-contrast, glowing neon accents (Electric Blue, Radiant Violet, Emerald) with glass card aesthetics and ambient background glow.
* 🔐 **Full Auth Flow**: Secure Sign-up, Sign-in, and 6-digit **Email OTP Verification** backed by encrypted hardware keystore (`expo-secure-store`).
* 📸 **Instant AI Receipt Scanner**: Capture or pick receipts from device storage and automatically extract merchant, date, category, and total amount.
* 📊 **Interactive Dashboard & Metrics**: Real-time spending overview, categorized recent expenses, and detailed expense inspection modal.
* 📦 **EAS Cloud APK Build**: Preconfigured EAS build profiles (`eas.json`) for one-command Android `.apk` generation.

### Mobile Setup & Running

```powershell
cd application

# 1. Install dependencies
npm install

# 2. Configure Environment Variables
# Copy .env.example to .env and set your backend IP address
cp .env.example .env

# 3. Start Expo development server
npx expo start -c
```

### Generating Android APK (EAS Build)

```powershell
cd application

# Log in to your Expo account (one-time setup)
eas login

# Build APK in the cloud
eas build -p android --profile preview
```

---

## 🚀 Backend Service (`backend/`)

### Key Features
* 📸 **Receipt OCR Scanner**: High-accuracy local text extraction from images using **PaddleOCR**.
* 🤖 **Smart AI Structuring (LangChain)**: Structured extraction (merchant, amount, currency, category, date, payment mode) using **Google Gemini** or local **Ollama** (e.g. `llama3.2`).
* 📧 **Email OTP Verification**: Integrated verification emails with 6-digit OTP delivery for user account activation.
* 🔐 **Secure JWT Authentication**: Access tokens, long-lived refresh tokens, and multi-device session management.
* 🛡️ **Clean MVC Architecture**: Divided into API Routes, Controllers, Services, SQLAlchemy Models, and Pydantic Schemas.
* 📊 **PostgreSQL & Alembic Migrations**: UUID primary keys, timezone-aware timestamps, and automated schema migration management.

### Backend Setup & Running

```powershell
cd backend

# 1. Create and activate virtual environment
uv venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
uv pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run database migrations
alembic upgrade head

# 5. Start the FastAPI server
fastapi dev main.py
```

Access the interactive API documentation at: **`http://127.0.0.1:8000/docs`**

---

## 🐳 Docker Deployment

To launch the full backend stack via Docker:

```powershell
cd backend
docker-compose up --build -d
```

---

## 📡 API Endpoint Reference

| Method | Path | Description | Authentication |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/signup` | Register new user account | Public |
| **POST** | `/api/v1/auth/login` | Authenticate user & issue tokens | Public |
| **POST** | `/api/v1/auth/send-otp` | Send/resend 6-digit email OTP | Public |
| **POST** | `/api/v1/auth/verify-otp` | Verify account using OTP | Public |
| **POST** | `/api/v1/auth/refresh` | Refresh access token | Public (Cookie) |
| **POST** | `/api/v1/auth/logout` | Revoke session tokens | Authenticated |
| **GET** | `/api/v1/transactions/` | List all user transactions | Authenticated |
| **POST** | `/api/v1/transactions/` | Manually log an expense | Authenticated |
| **POST** | `/api/v1/transactions/upload` | Upload receipt image -> OCR -> AI extraction | Authenticated |
| **DELETE** | `/api/v1/transactions/{id}` | Delete transaction by ID | Authenticated |
| **GET** | `/api/v1/health` | Service health status | Public |

---

## 📁 Repository Structure

```text
ExpanceTracker/
├── application/             # React Native (Expo SDK 54) Mobile App
│   ├── assets/              # App icons, splash, and branding assets
│   ├── src/
│   │   ├── api/             # Axios client, auth, and transaction APIs
│   │   ├── components/      # Glassmorphism UI component library
│   │   ├── screens/         # Auth, Dashboard, Scanner, Details screens
│   │   └── theme/           # Design tokens, color palette, and styles
│   ├── App.js               # Root navigation and authentication wrapper
│   ├── app.json             # Expo project configuration (SpendPulse)
│   ├── eas.json             # EAS cloud build profiles
│   └── package.json
│
├── backend/                 # FastAPI Backend Service
│   ├── alembic/             # Database migration versions
│   ├── app/
│   │   ├── api/v1/          # FastAPI routers
│   │   ├── controllers/     # Business flow & error orchestration
│   │   ├── core/            # Configuration settings & JWT utilities
│   │   ├── db/              # SQLAlchemy database session & Base
│   │   ├── models/          # SQLAlchemy DB models (User, Transaction)
│   │   ├── schemas/         # Pydantic schemas (Request/Response validation)
│   │   └── services/        # OCR, LLM, OTP, and DB service layers
│   ├── main.py              # Server entry point
│   ├── requirements.txt     # Python package requirements
│   └── docker-compose.yml
│
└── minimal_UI/              # Vanilla web interface for testing
```
