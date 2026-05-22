# Codebase Summary

## Repository Structure

```
integrated-hr-and-product-system/
├── backend/                    # Express API (Bun runtime)
│   ├── src/
│   │   ├── index.ts            # Entry point — server bootstrap
│   │   ├── config/             # All static config & constants
│   │   │   ├── database.config.ts          # DB connection config (stub)
│   │   │   └── constant/
│   │   │       ├── auth.config.ts          # JWT secrets + TTLs
│   │   │       ├── http.config.ts          # HttpStatusCode enum + type
│   │   │       └── regex.config.ts         # Auth regex (duplicates auth.config?)
│   │   ├── controller/
│   │   │   └── auth.controller.ts          # AuthController — signup handler
│   │   ├── lib/
│   │   │   └── database.ts                 # connectDB() — TODO: real driver
│   │   ├── middleware/
│   │   │   └── error.middleware.ts         # globalErrorHandler — AppError aware
│   │   ├── repository/
│   │   │   └── auth.repository.ts          # AuthRepository — empty stub
│   │   ├── route/
│   │   │   └── auth.route.ts               # POST /signup wired up
│   │   ├── service/
│   │   │   └── auth.service.ts             # AuthService.signup() — TODO impl
│   │   └── util/
│   │       └── error.util.ts               # AppError class
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React 19 app (Vite 8)
│   ├── src/
│   │   ├── App.tsx             # Root component
│   │   ├── App.css
│   │   ├── main.tsx            # React DOM mount
│   │   └── index.css
│   ├── package.json
│   └── vite.config (implied)
├── CLAUDE.md                   # AI engineering constitution
├── AGENTS.md                   # Sub-agent instructions (mirrors CLAUDE.md)
├── GEMINI.md                   # Gemini-specific instructions
├── README.md                   # Root readme
├── package.json                # Root workspace config
└── bun.lock
```

---

## Module Breakdown

### `backend/src/index.ts`

Entry point. Loads dotenv, creates Express app, registers middleware (`json`, `cookieParser`), mounts `authRoutes` at `/api/auth`, adds 404 catch-all and a raw global error handler (duplicates `globalErrorHandler` — see issues below).

### `backend/src/config/`

- **`auth.config.ts`** — `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TTL = "15m"`, `REFRESH_TOKEN_TTL = 7d ms`
- **`http.config.ts`** — `HttpStatusCode` const object + `HttpStatusCodeType`
- **`regex.config.ts`** — duplicates auth.config exports (copy-paste bug)
- **`database.config.ts`** — empty/stub for DB connection params

### `backend/src/lib/database.ts`

`connectDB()` async fn — logs success, process.exit(1) on failure. No real driver call yet.

### `backend/src/controller/auth.controller.ts`

`AuthController` class. DI: takes `AuthService` in constructor. `signup` handler: calls `service.signup(req.body)`, returns 201 or 400. Uses raw `any` types — no validation middleware.

### `backend/src/service/auth.service.ts`

`AuthService` class. `signup(data: any)` — empty, TODO comment only.

### `backend/src/repository/auth.repository.ts`

`AuthRepository` class — completely empty.

### `backend/src/route/auth.route.ts`

Instantiates `AuthService` → `AuthController`, mounts `POST /signup`.

### `backend/src/middleware/error.middleware.ts`

`globalErrorHandler(err, req, res, next)` — checks `instanceof AppError`, returns typed JSON error. Falls through to 500 for unhandled.

### `backend/src/util/error.util.ts`

`AppError extends Error` — adds `statusCode: number`, `layer: string` (e.g. "Database", "Auth"). Captures stack trace.

---

## Known Issues / Bugs

| #   | Location             | Issue                                                                                                         |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `regex.config.ts`    | Duplicates `auth.config.ts` exports — file serves no unique purpose                                           |
| 2   | `index.ts`           | Raw global error handler (lines 30-34) duplicates `globalErrorHandler` from middleware — double handling risk |
| 3   | `index.ts`           | `globalErrorHandler` from middleware is never actually registered — dead code                                 |
| 4   | `auth.service.ts`    | `signup()` is empty — endpoint returns undefined                                                              |
| 5   | `auth.repository.ts` | Completely empty — no DB interaction                                                                          |
| 6   | `auth.controller.ts` | Uses `any` for req/res — no input validation                                                                  |
| 7   | `auth.config.ts`     | `ACCESS_TOKEN_SECRET` falls back to `""` — silent failure in prod                                             |
| 8   | No `cors` middleware | Frontend can't call API in dev without it                                                                     |
