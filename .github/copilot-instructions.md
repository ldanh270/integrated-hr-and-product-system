# Copilot instructions for this repo

## Build, test, lint

- **Frontend (./frontend)**: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- **Backend (./backend)**: `bun run dev`
- **Tests**: no test scripts are currently configured in either package.json (so there is no single-test command yet)

## High-level architecture

- **Two separate apps**: a Bun + Express TypeScript backend in `backend/` and a Vite + React frontend in `frontend/`.
- **Backend entrypoint**: `backend/src/index.ts` configures Express, wires routes, and starts the server after `connectDB()` in `backend/src/lib/database.ts`.
- **Backend layering**: routes in `backend/src/route` build controllers from services (e.g., `auth.route.ts` → `AuthController` → `AuthService`) with repositories under `backend/src/repository`.
- **Frontend entrypoint**: `frontend/src/main.tsx` renders `App.tsx`. Vite is configured in `frontend/vite.config.ts` with the React Compiler preset.

## Key conventions

- **Backend path alias**: `@/` maps to `backend/src` (see `backend/tsconfig.json`), and backend imports include the `.ts` extension.
- **Error handling**: shared `AppError` lives in `backend/src/util/error.util.ts`, and the global handler is in `backend/src/middleware/error.middleware.ts`.
- **Formatting**: repo-level Prettier config in `.prettierrc` enforces no semicolons, 100-col width, and import sorting via `@trivago/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss`.
