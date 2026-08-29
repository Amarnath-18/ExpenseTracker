# SpendPulse (ExpenseTracker) Agent Notes

## Project Overview

- Workspace root: `D:\codes\ExpanceTracker`
- Architecture: Full-stack monorepo
  - `application/`: React Native (Expo SDK 54) mobile client branded **SpendPulse** (`com.spendpulse.app`)
  - `backend/`: FastAPI backend with PostgreSQL, PaddleOCR, LangChain (Google Gemini / Ollama), and Email OTP
  - `minimal_UI/`: Web test client

---

## Mobile Application Architecture (`application/`)

- Framework: React Native 0.81 with Expo SDK 54
- Theme: Dark Glassmorphic design system (`src/theme/tokens.js`, obsidian `#0A0F1D`, electric blue `#3B82F6`, vibrant violet `#8B5CF6`)
- Navigation: `@react-navigation/native-stack` and `@react-navigation/bottom-tabs`
- Storage: `expo-secure-store` for JWT access and refresh tokens
- Environment: Native `EXPO_PUBLIC_API_URL` variable loaded from `.env`
- APK Generation: EAS Cloud Build (`eas.json` preview profile -> `.apk`)

### Key Frontend Folders
```text
application/
├── assets/                  # App icon (1024x1024), adaptive icon, splash screen
├── src/
│   ├── api/                 # Axios client interceptors, auth.js, transactions.js
│   ├── components/          # GlassCard, GlassInput, GlassButton, GlassHeader, BackgroundGlow
│   ├── screens/             # Login, Signup, VerifyOtp, Dashboard, AddTransaction, ScanReceipt, TransactionDetail
│   └── theme/               # Design tokens, color palette, gradients, typography
├── App.js                   # Root navigation, safe-area provider, and auth context
├── app.json                 # Expo project manifest (SpendPulse, com.spendpulse.app)
└── eas.json                 # EAS build configuration
```

---

## Backend Architecture (`backend/`)

Layer responsibilities:
- `app/api/v1/routes/`: FastAPI route endpoints (Auth, Transactions, Expenses, Health)
- `app/controllers/`: Request orchestration, status code mapping, and exception handling
- `app/services/`: OCR (PaddleOCR), LLM structuring (LangChain), OTP generation/verification, and DB queries
- `app/models/`: SQLAlchemy models (`User`, `Transaction`, `Expense`)
- `app/schemas/`: Pydantic request and response schemas
- `app/db/`: Database connection engine and session factory
- `app/core/config.py`: Environment configuration settings

### API Endpoint Blueprint

| Method | Path | Description | Response Schema |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/signup` | Register new user account | `UserResponse` |
| **POST** | `/api/v1/auth/login` | Authenticate user & issue tokens | `TokenResponse` |
| **POST** | `/api/v1/auth/send-otp` | Send/resend 6-digit email OTP | `OTPResponse` |
| **POST** | `/api/v1/auth/verify-otp` | Verify account using OTP | `OTPResponse` |
| **POST** | `/api/v1/auth/refresh` | Refresh access token | `TokenResponse` |
| **POST** | `/api/v1/auth/logout` | Revoke session tokens | `dict` |
| **GET** | `/api/v1/transactions/` | List all user transactions | `TransactionListResponse` |
| **POST** | `/api/v1/transactions/` | Manually log an expense | `TransactionResponse` |
| **POST** | `/api/v1/transactions/upload` | Upload receipt image -> OCR -> AI extraction | `TransactionResponse` |
| **DELETE** | `/api/v1/transactions/{id}` | Delete transaction by ID | `TransactionDeleteResponse` |
| **GET** | `/api/v1/health` | Service health status | `HealthResponse` |

---

## Production Best Practices Implemented

- **Peer Dependency Completeness**: Installed `expo-font` alongside `@expo/vector-icons` so standalone native APK builds launch without missing module crashes.
- **Safe Area Provider Hierarchy**: `<SafeAreaProvider>` wraps the entire application from the first frame.
- **Try-Catch Block Pattern**: All controllers wrap database queries and external services inside try-catch blocks with clean logging.
- **Session Rollback**: Write operations rollback on exceptions to prevent dangling transactions.
