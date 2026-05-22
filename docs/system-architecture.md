# System Architecture

## Overview

Monorepo with two independent apps sharing no runtime code. Frontend calls backend over HTTP.

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│   React 19 + Vite 8  (port: 5173 dev)                   │
│   └── App.tsx (placeholder, not yet built out)          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (REST)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│   Bun + Express 5  (port: 5000)                         │
│                                                         │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Routes   │→ │ Controllers   │→ │    Services     │  │
│  │auth.route │  │auth.controller│  │  auth.service   │  │
│  └───────────┘  └───────────────┘  └───────┬─────────┘  │
│                                            │            │
│                                   ┌────────▼────────┐   │
│                                   │  Repositories   │   │
│                                   │ auth.repository │   │
│                                   └────────┬────────┘   │
│                                            │            │
│  ┌──────────────────┐             ┌────────▼────────┐   │
│  │   Middleware     │             │    Database     │   │
│  │ error.middleware │             │  (TODO: driver) │   │
│  └──────────────────┘             └─────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Config / Constants                              │   │
│  │  auth.config · http.config · database.config     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Utils & Lib                                     │   │
│  │  AppError (error.util) · connectDB (database)    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
Express Router (/api/auth/*)
    │
    ├─ express.json()        ← parse body
    ├─ cookieParser()        ← parse cookies
    │
    ▼
Route Handler (auth.route.ts)
    │
    ▼
Controller (auth.controller.ts)
    ├─ [MISSING] Zod validation of req.body
    ├─ calls service method
    │
    ▼
Service (auth.service.ts)
    ├─ [MISSING] business logic (hash password, create JWT)
    ├─ calls repository
    │
    ▼
Repository (auth.repository.ts)
    ├─ [MISSING] DB query
    │
    ▼
Database (lib/database.ts)
    └─ [TODO] real driver (pg / mysql2)

    │ (on error anywhere)
    ▼
throw AppError(message, statusCode, layer)
    │
    ▼
globalErrorHandler middleware
    └─ JSON response { message }
```

---

## Auth Flow (Planned — Not Implemented)

```
POST /api/auth/signup
  → validate body (email, password, name)
  → check email not taken (repository)
  → hash password (bcrypt)
  → insert user (repository)
  → sign access token (JWT, 15m)
  → set refresh token in httpOnly cookie (7d)
  → return 201 { data: user }

POST /api/auth/login
  → validate body
  → find user by email (repository)
  → compare password (bcrypt)
  → sign tokens
  → set cookie
  → return 200 { data: user }

POST /api/auth/logout
  → clear cookie
  → 204

POST /api/auth/refresh
  → read refresh token from cookie
  → verify JWT
  → sign new access token
  → return 200 { accessToken }
```

---

## Current API Endpoints

| Method | Path               | Status                  | Auth |
| ------ | ------------------ | ----------------------- | ---- |
| GET    | `/`                | ✅ Working              | None |
| POST   | `/api/auth/signup` | ⚠️ Wired, service empty | None |
| `*`    | `/*`               | ✅ 404 handler          | —    |

---

## Missing Architecture Components

| Component                            | Priority    | Notes                          |
| ------------------------------------ | ----------- | ------------------------------ |
| DB driver (pg/mysql2)                | 🔴 Critical | Nothing persists               |
| `middleware/auth.middleware.ts`      | 🔴 Critical | JWT guard for protected routes |
| `middleware/validate.middleware.ts`  | 🔴 High     | Zod schema validation          |
| `middleware/cors.middleware.ts`      | 🔴 High     | Frontend can't call API        |
| `types/` directory                   | 🟡 Medium   | Shared TS interfaces           |
| `config/env.ts`                      | 🟡 Medium   | Typed env wrapper, fail-fast   |
| `tests/` directory                   | 🟡 Medium   | Zero test coverage             |
| Rate limiting (`express-rate-limit`) | 🟡 Medium   | Auth endpoint protection       |
| API versioning (`/api/v1/`)          | 🟢 Low      | Future-proofing                |
