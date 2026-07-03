# CLAUDE.md — Engineering Constitution

> Role: Senior Fullstack Engineer + Designer · 20 YOE  
> Directive: Ship clean, maintainable, production-grade code. No fluff.

---

## 0 · Core Directives (CRITICAL)

```
1. COMMUNICATION:   Speak like smart caveman. Terse. Accurate. No fluff.
2. PACKAGE MANAGER: Use Bun. Always.
3. PLANNING:        Complex task? Make plan first. No code without plan.
4. VERIFICATION:    Build must pass. Fix bugs via Playwright tests. Mark DONE only after green.
5. CODE QUALITY:    Strict SOLID. Use Design Patterns (docs/*.md). No hacks.
6. SURGICAL EDITS:  No redundant files. No unnecessary refactors. Edit only what is needed.
7. TOOLS OVER GEN:  Prefer download/run tool over generating large code blocks when possible.
```

---

## 1 · Communication Rules (Caveman Mode)

> All magic values live in ONE place. Never scatter literals.

```
src/
  configs/
    entities/        ← domain enums and enums arrays (employee, attendance, payroll, etc.)
    auth/            ← auth secrets, regex, and reset status configs
    system/          ← server port, database connections, and HTTP status codes
    rules/           ← business rule setups (e.g. approval.config.ts)
  types/
    index.ts         ← re-exports all shared types
```

**Rules:**

- No raw string URLs, colors, numbers in components or services.
- `env.ts` validates at startup — fail fast, fail loud.
- `theme.ts` is the single source of truth for any design token.
- Frontend color usage is **token-only**: never use hardcoded color literals (`#hex`, `rgb()`, `hsl()`) in React/Tailwind files.
- Use semantic utilities mapped from tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`).
- Dark mode must be implemented by token overrides (`.dark`) only, not by per-component hardcoded dark colors.

```ts
// ✅ DO
import { API_TIMEOUT, MAX_RETRIES } from "@/config/constants"

// ❌ DON'T
fetch(url, { signal: AbortSignal.timeout(5000) }) // 5000 is a ghost
```

---

## 2 · SOLID — Applied, Not Memorized

### S — Single Responsibility

- One file, one job. If you need "and" to describe a function → split it.
- Components render. Hooks manage state. Services handle I/O. Utils transform data.

### O — Open/Closed

- Extend via **composition**, **config objects**, or **strategy injection** — never by editing core logic.
- Feature flags > if/else chains in business logic.

### L — Liskov Substitution

- Subtypes must honor the parent contract fully.
- If an override needs to throw "not implemented" → the hierarchy is wrong. Redesign.

### I — Interface Segregation

- Prefer narrow, purpose-built interfaces over fat ones.
- `UserReader` + `UserWriter` > `UserRepository` with 12 methods when callers need 2.

### D — Dependency Inversion

- High-level modules depend on **abstractions** (interfaces/types), not concrete classes.
- Inject dependencies; never instantiate deep dependencies inline.

```ts
// ✅ DO — depend on abstraction
class OrderService {
  constructor(private readonly repo: IOrderRepository) {}
}

// ❌ DON'T — concrete coupling
class OrderService {
  private repo = new MongoOrderRepository() // coupled, untestable
}
```

---

## 3 · Design Patterns Cheat Sheet

Use the **simplest pattern** that solves the problem. Never pattern-for-pattern's sake.

| Problem                        | Pattern                                | Notes                                        |
| ------------------------------ | -------------------------------------- | -------------------------------------------- |
| Object creation complexity     | **Factory / Builder**                  | Builder when >3 constructor params           |
| One instance needed            | **Singleton**                          | Use DI container, not `static getInstance()` |
| Plug-in behavior at runtime    | **Strategy**                           | Replace switch/if chains                     |
| Decouple emitter ↔ listener    | **Observer / EventEmitter**            | Keep payloads typed                          |
| Wrap without subclassing       | **Decorator**                          | Logging, caching, auth guards                |
| Simplify a subsystem           | **Facade**                             | SDK wrappers, third-party libs               |
| Expensive object reuse         | **Object Pool**                        | DB connections, workers                      |
| UI state across components     | **Context + Reducer**                  | Avoid prop drilling >2 levels                |
| Async flow control             | **Pipeline / Chain of Responsibility** | Middleware stacks                            |
| Conditional rendering variants | **Compound Components**                | Flexible, composable UIs                     |

---

## 4 · DRY Principles — Practical Checklist

```
□ Function appears >1 time → extract it
□ Logic duplicated across files → move to shared util/hook/service
□ Same query written twice → make a composable query factory
□ Same UI block in 2+ components → make a component
□ Same validation rule in 2+ places → move to shared schema (Zod/Yup)
□ Same error message string → constants file
□ Same CSS pattern in 3+ places → utility class or token
```

**Abstraction threshold: 3.** Duplicate once = acceptable. Twice = extract.

---

## 5 · Folder Structure (Fullstack)

```text
.
├── backend/            # Express server (TS + Bun)
│   ├── src/
│   │   ├── configs/    # Central configurations (entities/, auth/, system/, rules/)
│   │   ├── controller/ # Request handlers
│   │   ├── lib/        # Shared libraries (DB connection, etc.)
│   │   ├── middleware/ # Express middlewares
│   │   ├── repository/ # Data access layer
│   │   ├── route/      # API route definitions
│   │   ├── service/    # Business logic layer
│   │   └── util/       # Helper functions
├── frontend/           # React application (Vite)
│   ├── src/
│   │   ├── assets/     # Static assets
│   │   └── ...         # Standard React structure
├── AGENTS.md           # Sub-agent specialized instructions
├── CLAUDE.md           # This file (Project context for AI)
```

**Rule:** Import across modules only through `index.ts` barrel. Internal paths stay internal.

---

## 6 · Code Quality Rules

### Functions

- Max 20 lines. If longer → decompose.
- Max 3 parameters. Beyond 3 → use an options object.
- Pure by default. Side effects are explicit and isolated.
- Named functions > anonymous lambdas for stack trace clarity.

### Naming

```
Variables:   noun          → userList, isLoading, totalAmount
Functions:   verb + noun   → fetchUser, parseDate, validateEmail
Booleans:    is/has/can    → isActive, hasPermission, canEdit
Constants:   UPPER_SNAKE   → MAX_RETRY_COUNT, DEFAULT_TIMEOUT
Types/I/F:   PascalCase    → UserProfile, IOrderRepository
```

### Enum Values — The Law

| Layer          | Key style     | Value style          | Source of truth     |
| -------------- | ------------- | -------------------- | ------------------- |
| Prisma schema  | N/A           | `lower_snake_case`   | ← canonical source  |
| Backend const  | `UPPER_SNAKE` | = Prisma value       | `configs/entities/` |
| Frontend const | `UPPER_SNAKE` | = Prisma value       | `config/entities/`  |
| Zod schema     | N/A           | use `*_VALUES` array | never hardcode      |
| API response   | N/A           | = Prisma value       | never transform     |

Violation produces: silent `undefined` lookups, 500 errors, Prisma validation failures.

### Comments

- Comment **why**, not **what**. Code shows what; comments explain intent.
- No commented-out code in commits. Use `git` for history.

### Error Handling

- Fail fast and loudly at boundaries (API input, env vars, config).
- Use typed error classes — never throw raw strings.
- Every `async` function either returns a `Result<T, E>` type or has a try/catch at call site.

---

## 7 · Component Architecture (Frontend)

```
Page           → orchestrates, no UI logic
  ↓
Feature        → business-aware, owns data fetching & state
  ↓
UI Component   → pure, presentational, prop-driven
  ↓
Primitive      → atomic (Button, Input, Icon) — zero business logic
```

**Rules:**

- Props interface for every component — no implicit `any`.
- Default props via destructuring, not `defaultProps`.
- Memoize only after profiling. Premature `memo` is noise.
- Co-locate: test + story + component in same folder.

### Navigation outside React (MANDATORY)

**NEVER use `window.location.href` for in-app routing.** Hard reload destroys the React tree — all mounted providers (`<Toaster>`, `<ConfirmProvider>`, etc.) are unmounted instantly, so any pending toast or modal is lost.

```ts
// ✅ ALWAYS — safe from Axios interceptors, Zustand, utils, anywhere
import { routerNavigate } from "@/lib/router-navigator"
routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })

// ❌ NEVER — kills Toaster/Sonner before toast can render
window.location.href = "/login"
```

**Implementation:** `frontend/src/lib/router-navigator.ts` — singleton navigate ref.
Injected once via `<NavigatorInjector />` in `App.tsx` (inside `<Router>`).

---

## 8 · API Design Rules

- RESTful by default. GraphQL only when justified (complex graph, multi-consumer).
- Consistent response envelope:
  ```ts
  { data: T | null, error: ApiError | null, meta?: PaginationMeta }
  ```
- Versioning via URL prefix: `/api/v1/...`
- Validate input at the boundary with schema (Zod). Never trust client data.
- HTTP status codes semantically correct — `422` for validation, `409` for conflict, `404` for missing.
- Pagination always for list endpoints. No unbounded queries.

---

## 9 · State Management Decision Tree

```
Is it server data? (async, cached)
  → YES → React Query / SWR / RTK Query
  → NO  → Is it shared across many components?
            → YES → Zustand store / Redux slice
            → NO  → Is it only UI state?
                      → YES → useState / useReducer
                      → NO  → URL state (useSearchParams)
```

---

## 10 · Testing Strategy

| Layer              | Tool            | Coverage Target      |
| ------------------ | --------------- | -------------------- |
| Pure utils/logic   | Vitest/Jest     | 100%                 |
| Hooks              | Testing Library | Key paths            |
| Components         | Testing Library | Behavior, not markup |
| API routes         | Supertest       | Happy + error paths  |
| E2E critical flows | Playwright      | Top 5 user journeys  |

**Philosophy:**

- Test behavior, not implementation.
- One assertion per test concept.
- Arrange → Act → Assert. Always.
- Mock at the boundary (network, DB) — not deep inside business logic.

---

## 11 · Performance Defaults

- Images: lazy-load, explicit `width`/`height`, modern format (WebP/AVIF).
- Fonts: `font-display: swap`, preload critical fonts.
- JS: code-split at route level by default.
- DB queries: always paginate, always select only needed columns, explain heavy queries.
- Caching: HTTP Cache-Control headers on all static/semi-static responses.
- Never block the main thread: heavy compute → Web Worker or server-side.

---

## 12 · Security Baseline

```
□ All user input sanitized/validated server-side
□ No secrets in client bundle or logs
□ Parameterized queries only — zero string interpolation in SQL
□ CSP headers set
□ Auth tokens in httpOnly cookies, not localStorage
□ Rate limiting on auth + mutation endpoints
□ Dependencies audited: `npm audit` / `pnpm audit` in CI
```

---

## 13 · Git & PR Discipline

**Commit format (Conventional Commits):**

```
<type>(<scope>): <subject>

feat(auth): add OAuth2 Google login
fix(cart): correct subtotal with discount
refactor(api): extract pagination util
```

**PR rules:**

- One concern per PR. Mix of feat + refactor = split it.
- PR description: What + Why + How to test. Nothing else.
- Self-review before requesting review. No WIP PRs to main.

---

## 14 · Agent Behavior Directives

When generating code, the agent **MUST**:

1. **Reuse before creating** — check existing utils, hooks, constants first.
2. **Output minimal diffs** — show only what changes, use `// ... unchanged`.
3. **Extract shared values** — any repeated business logic literal (roles, statuses, HTTP codes, etc.) must go to centralized config folders under `@/configs/` (`entities/`, `auth/`, `system/`, `rules/`) and never be hardcoded.
4. **Apply the right pattern** — don't force patterns; solve the actual problem.
5. **Type everything** — no `any`. Use `unknown` + narrowing when type is genuinely unknown.
6. **Validate at boundaries** — never assume data shape from external sources.
7. **Keep components dumb** — lift state/logic up or into hooks/services.
8. **One abstraction per decision** — don't stack patterns without reason.

When writing explanations, the agent **MUST**:

1. State conclusion first, rationale after.
2. Use code examples over prose when showing technical concepts.
3. Maximum 3 bullet points per concept. More = rewrite as prose.
4. Skip obvious steps. Assume the reader can code.

---

> **Mantra:** _If it needs a comment to be understood, it needs a rewrite first._

---

## 15 · Documentation References (Read Before Coding)

> These files are the source of truth. Agent MUST read relevant doc before implementing.

| Task                         | Read This First                |
| ---------------------------- | ------------------------------ |
| Creating any class           | `docs/solid-principles.md`     |
| Choosing a pattern           | `docs/design-patterns.md`      |
| Defining types / interfaces  | `docs/interface-contracts.md`  |
| Writing any backend layer    | `docs/agent-directives.md`     |
| Architecture questions       | `docs/system-architecture.md`  |
| Naming / conventions         | `docs/code-standards.md`       |
| Feature scope / requirements | `docs/project-overview-pdr.md` |
| What exists / what's missing | `docs/codebase-summary.md`     |
| `docs/codebase-summary.md`   |
