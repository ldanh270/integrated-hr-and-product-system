# Copilot instructions for this repo

## Build, test, lint

- **Frontend (./frontend)**: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- **Backend (./backend)**: `bun run dev`
- **Tests**: no test scripts configured yet

## High-level architecture

- **Two separate apps**: Bun + Express TypeScript backend in `backend/`, Vite + React frontend in `frontend/`.
- **Backend entrypoint**: `backend/src/index.ts` — configures Express, wires routes, starts server after `connectDB()`.
- **Backend layering** (strict, no shortcuts):
  ```
  Route → Controller → Service → Repository → DB
  ```
  - Route: only place with `new ConcreteClass()` wiring
  - Controller: HTTP adapter, depends on `IService` interface
  - Service: business logic, depends on `IRepository` interface
  - Repository: SQL only, implements `I*Repository` interface
- **Frontend entrypoint**: `frontend/src/main.tsx` renders `App.tsx`. Vite configured with React Compiler preset.

## Key conventions

- **Path alias**: `@/` → `backend/src/` (see `backend/tsconfig.json`). Always include `.ts` extension.
- **Error handling**: `AppError(message, statusCode, layer)` from `backend/src/util/error.util.ts`. Global handler in `backend/src/middleware/error.middleware.ts`. Never throw raw strings.
- **No `any`**: use typed interfaces. DTOs for input, domain models for output.
- **Parameterized SQL only**: never string interpolation (`$1, $2` placeholders).
- **Constants**: all literals in `backend/src/config/constant/`. Use `HttpStatusCode.OK` not `200`.
- **Formatting**: Prettier — no semicolons, 100-col width, import sorting via `@trivago/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss`.

## SOLID enforcement

Read before generating any class:

| Rule | One-line |
|------|---------|
| S — SRP | One class, one reason to change. Split if description needs "and". |
| O — OCP | Extend via Strategy/Factory/config. Never edit working core logic. |
| L — LSP | Every interface implementor satisfies full contract. No "not implemented" throws. |
| I — ISP | Narrow interfaces. `IAuthReader` + `IAuthWriter` > fat `IAuthRepository`. |
| D — DIP | Depend on interfaces. Inject via constructor. Never `new Concrete()` inside a class. |

Full reference: [`docs/solid-principles.md`](../docs/solid-principles.md)

## Design patterns in use

| Pattern | Where |
|---------|-------|
| Repository | `repository/*.repository.ts` implements `I*Repository` |
| Strategy | Auth variants, notification types |
| Facade | `util/jwt.util.ts`, `util/hash.util.ts` wrap raw libs |
| Decorator | Every middleware (`validate`, `requireAuth`, `rateLimiter`) |
| Chain of Responsibility | Middleware stack in route files |
| Observer | `lib/event-bus.ts` for domain events |
| Singleton | Module-level exports (`lib/database.ts`) |

Full reference: [`docs/design-patterns.md`](../docs/design-patterns.md)

## Documentation index

| Doc | Read when... |
|-----|-------------|
| [`docs/agent-directives.md`](../docs/agent-directives.md) | Writing any backend layer |
| [`docs/solid-principles.md`](../docs/solid-principles.md) | Creating any class |
| [`docs/design-patterns.md`](../docs/design-patterns.md) | Choosing implementation approach |
| [`docs/interface-contracts.md`](../docs/interface-contracts.md) | Defining types / interfaces |
| [`docs/system-architecture.md`](../docs/system-architecture.md) | Architecture questions |
| [`docs/code-standards.md`](../docs/code-standards.md) | Naming / conventions |
| [`docs/codebase-summary.md`](../docs/codebase-summary.md) | What exists, known bugs |
