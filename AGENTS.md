# AGENTS.md — Engineering Constitution & Multi-Agent Orchestration Protocol

> **Role:** Expert AI Architect & Tech Lead  
> **Architecture:** Hierarchical Delegation (Master-Subagent Model)  
> **Tech Stack:** Node.js (Express 5/Bun), React 19 (Vite), TypeScript, Tailwind CSS  
> **Standard:** Clean Architecture + SOLID + Design Patterns

---

## 0 · The Hierarchical Roster (Agent Role Definitions)

Our development team operates on a strict **Hierarchical Delegation** model. The `Tech-Lead-Coordinator` acts as the single point of entry and decision-making authority, orchestrating specialized sub-agents.

### 1. `Tech-Lead-Coordinator-Agent`
- **Responsibilities:** Requirements analysis, task decomposition, architectural planning, code review coordination, and conflict resolution.
- **Authority:** Final approval on all implementation plans and `plans/*.md` files.
- **MCP Access:** 
  - `GitHub`: Managing issues, PR status, and branch orchestration.
  - `OpenRouter`: Orchestrating LLM routing for sub-agents.
  - `Figma`: High-level page/layout structure analysis (read-only).

### 2. `Frontend-UI-Agent`
- **Responsibilities:** Building React components, implementing design systems (Tailwind), managing client-side state, and routing.
- **Authority:** Final say on component styling, accessibility (A11y), and UX implementation details.
- **MCP Access:**
  - `Figma`: Intensive node parsing, asset extraction, and design-to-code translation.
  - `GitHub`: Reading/Writing to `frontend/` directory.

### 3. `Backend-Logic-Agent`
- **Responsibilities:** API design, business logic (Services), data access (Repositories), database schema management, and security.
- **Authority:** Integrity of the data layer and API contract performance.
- **MCP Access:**
  - `GitHub`: Reading/Writing to `backend/` directory.
  - `Database (TBD)`: Schema migrations and query optimization.

### 4. `QA-Review-Agent`
- **Responsibilities:** Automated testing (Unit, Integration, E2E), security audits, and performance profiling.
- **Authority:** Blocking merges if DoD criteria are not met.
- **MCP Access:**
  - `Playwright`: Executing E2E tests and browser automation.
  - `GitHub`: Posting review comments and approving/rejecting PRs.

---

## 1 · Communication Protocols

To ensure zero-loss handoffs, agents MUST communicate using structured formats.

### Data Handoff Formats
- **Task Specs:** Shared via JSON schemas in `.agents/specs/`.
- **Architectural Plans:** Must include Mermaid.js UML diagrams (Sequence, Class, or ERD).
- **API Contracts:** Must follow the `ApiResponse<T>` envelope:
  ```ts
  { "data": T | null, "error": { "message": string, "code": string } | null, "meta": any }
  ```

### Fallback & Error Handling
- **No Hallucinations:** If an agent hits an error (e.g., dependency mismatch), it must return the **exact stack trace** and environment state to the `Tech-Lead`.
- **Backprop Logic:** Every failure must trigger a "Post-Mortem" check: "Which `§V` (Invariant) in our spec would have prevented this?"
- **Clarification Loop:** If a task is underspecified, the agent must ask **exactly one** clarifying question and wait for the `Tech-Lead` (or User) to respond.

---

## 2 · Development Workflow (SOP)

### Step 1: Research & Discovery
- `Tech-Lead` uses `grep_search` and `glob` to map the codebase.
- `Tech-Lead` reproduces the issue or validates the new feature request.

### Step 2: Strategic Planning
- `Tech-Lead` drafts a Design Doc in `plans/` using `enter_plan_mode`.
- `Frontend` and `Backend` agents review the plan for feasibility.

### Step 3: Concurrent Execution
- **Backend:** `Backend-Logic-Agent` implements Interfaces and Repositories first.
- **Frontend:** `Frontend-UI-Agent` builds UI Primitives and Feature-slices in parallel.
- **Sync:** They use `interface-contracts.md` as the source of truth for communication.

### Step 4: Verification & Backprop
- `QA-Review-Agent` runs `Vitest` for units and `Playwright` for E2E.
- If a test fails, `QA-Agent` identifies the root cause and reports to `Tech-Lead`.

### Step 5: Merge & Deployment
- `QA-Agent` performs a final linting and security scan (`npm audit`).
- `Tech-Lead` summarizes changes and prepares the PR.

---

## 3 · Definition of Done (DoD)

A task is not complete until the `QA-Review-Agent` verifies the following:

1. **Behavioral Correctness:** All requirements from the User Story are met and verified by E2E tests.
2. **Technical Integrity:**
   - **Zero Linting Errors:** Clean output from `eslint` and `prettier`.
   - **Type Safety:** No `any` types; Zod validation at all boundaries.
   - **SOLID Compliance:** No class/function violates the S.O.L.I.D. principles.
   - **Test Coverage:** Minimum 80% coverage for new business logic.
3. **Architecture Standard:**
   - **Feature-Sliced Design:** Code is placed in the correct `modules/` or `services/` directory.
   - **Design Patterns:** Proper use of Repository, Strategy, or Factory patterns where applicable.
4. **Metadata & SEO:**
   - **JSON-LD:** Valid implementation for relevant pages.
   - **Git Hygiene:** No staging/committing bypasses; commit messages follow Conventional Commits.

---

## 4 · Technical Constraints (The "How")

### General
- **File Naming:** `kebab-case.ts`.
- **File Size:** Max 200 lines.
- **Abstraction Threshold:** 3 (Duplicate once = okay, twice = extract).

### Backend (Clean Architecture)
- **Layering:** Route → Controller → Service → Repository.
- **DI:** Constructor injection only.
- **Errors:** Throw `AppError(message, statusCode, layer)`.

### Frontend (React 19)
- **Hierarchy:** Page → Feature → UI Component → Primitive.
- **State:** Server (React Query), Global (Zustand/Context), Local (useState).
- **Styling:** Tailwind CSS utility-first.

---

> **Mantra:** *Design for people, implement for machines, orchestrate for agents.*
