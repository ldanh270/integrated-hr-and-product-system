[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/nXoHondQ)

# SWP391 — HRM System · Team 7

Human Resource Management system. University project, Summer 2026.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Runtime  | Bun                               |
| Backend  | Express 5 + TypeScript            |
| Frontend | React 19 + Vite 8 + TypeScript    |
| Auth     | JWT (access 15m) + httpOnly cookie (refresh 7d) |
| Database | TBD (driver not yet connected)    |

---

## Project Structure

```
.
├── backend/            # Express REST API
│   └── src/
│       ├── index.ts        # Server entry point
│       ├── config/         # Constants, env, DB config
│       ├── controller/     # HTTP request handlers
│       ├── lib/            # Shared libs (DB connection)
│       ├── middleware/     # Express middleware
│       ├── repository/     # Data access layer
│       ├── route/          # Route definitions
│       ├── service/        # Business logic
│       └── util/           # Helpers & error classes
├── frontend/           # React SPA
│   └── src/
│       ├── App.tsx
│       └── main.tsx
├── docs/               # Architecture & standards docs
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md
│   ├── code-standards.md
│   └── system-architecture.md
├── CLAUDE.md           # AI engineering constitution
└── AGENTS.md           # Sub-agent instructions
```

---

## Setup

### Prerequisites
- [Bun](https://bun.sh) >= 1.0
- Node.js >= 20 (for frontend)

### Backend

```bash
cd backend
cp .env.example .env        # create from example (see env vars below)
bun install
bun dev                     # hot-reload on :5000
```

### Frontend

```bash
cd frontend
bun install                 # or npm install
bun dev                     # vite dev server on :5173
```

### Environment Variables

```env
# backend/.env
PORT=5000
ACCESS_TOKEN_SECRET=your_jwt_secret_here
# DB vars (when driver added):
# DB_HOST=
# DB_PORT=
# DB_NAME=
# DB_USER=
# DB_PASS=
```

---

## API

Base URL: `http://localhost:5000`

| Method | Path               | Description          | Status      |
|--------|--------------------|----------------------|-------------|
| GET    | `/`                | Health check         | ✅ Working  |
| POST   | `/api/auth/signup` | Register new user    | ⚠️ Stub    |

> See `docs/system-architecture.md` for planned endpoints.

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md) | Feature requirements, tech decisions |
| [`docs/codebase-summary.md`](docs/codebase-summary.md) | Module breakdown, known bugs |
| [`docs/code-standards.md`](docs/code-standards.md) | Naming, patterns, what's missing |
| [`docs/system-architecture.md`](docs/system-architecture.md) | Architecture diagram, request flow |

---

## What's Missing (Priority Order)

1. 🔴 DB driver (`pg` or `mysql2`) — nothing persists
2. 🔴 Auth middleware — JWT guard for protected routes
3. 🔴 `cors` middleware — frontend blocked from calling API
4. 🔴 Auth service logic — signup/login/logout/refresh unimplemented
5. 🟡 Zod input validation — all endpoints accept raw unvalidated body
6. 🟡 `config/env.ts` — typed env wrapper with startup validation
7. 🟡 `types/` directory — shared TypeScript interfaces
8. 🟡 Tests — zero coverage
9. 🟡 Rate limiting on auth endpoints
