# Integrated HR & Product System (HRP)

A comprehensive and modern Integrated Human Resource and Product Management System.

---

## 🛠️ Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Runtime  | **Bun** (Primary runtime & package manager)     |
| Backend  | Express 5 + TypeScript + Prisma ORM             |
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind CSS   |
| Database | PostgreSQL                                      |
| Auth     | JWT (access 15m) + httpOnly cookie (refresh 7d) |

---

## 📁 Project Structure

```text
.
├── backend/            # Express REST API (TypeScript + Bun)
│   ├── src/
│   │   ├── configs/    # Centralized configurations (entities, auth, system, rules)
│   │   ├── controllers/# Request handlers (HTTP adapters)
│   │   ├── libs/       # Shared libraries (DB connection, Prisma client)
│   │   ├── middlewares/# Express Middlewares (CORS, Validation, Auth guards)
│   │   ├── repositories/# Data access layer (Prisma queries)
│   │   ├── routes/     # API route definitions
│   │   ├── services/   # Core Business Logic Layer
│   │   ├── utils/      # Helpers & Custom Errors (AppError)
│   │   └── scripts/    # Standalone scripts (Seed, Clear DB, Hash password)
│   └── prisma/         # Prisma Schema & Migrations
├── frontend/           # React SPA (Vite + TypeScript)
│   └── src/
│       ├── components/ # Shared UI Components / Primitives
│       ├── features/   # Feature-sliced modules
│       ├── pages/      # Route pages
│       └── App.tsx
└── docs/               # System Architecture & Coding Standards Documentation
```

---

## 🚀 Getting Started

### 1. System Requirements

- **[Bun](https://bun.sh)** (`>= 1.0`) is required.

### 2. Install Dependencies

Run the following command at the **ROOT** directory to install dependencies for both Frontend and Backend concurrently:

```bash
bun run install:all
```

### 3. Environment Variables

Create the `backend/.env` file by copying the provided example:

```bash
cp backend/.env.example backend/.env
```

Configure your PostgreSQL database connection string in `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/hrm_db?schema=public"
ACCESS_TOKEN_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_here
```

---

## 💻 CLI Commands (Root Level)

You can run development and database management commands directly from the **ROOT** directory without navigating into subfolders.

### 1. Development Environment

| Command                | Description                                                                                    |
| :--------------------- | :--------------------------------------------------------------------------------------------- |
| `bun run dev`          | Starts both **Backend** (`:5000`) and **Frontend** (`:5173`) concurrently.                     |
| `bun run dev:all`      | **(Recommended)** Starts **Frontend** + **Backend** + **Prisma Studio** (Visual Database GUI). |
| `bun run dev:backend`  | Starts only the Backend (with hot-reload).                                                     |
| `bun run dev:frontend` | Starts only the Frontend (Vite Dev Server).                                                    |

> [!TIP]
> Use **`bun run dev:all`** to develop while having direct access to your database via Prisma Studio (default at `http://localhost:5555`).

---

### 2. Database Management (Prisma)

| Command                 | Description                                                             |
| :---------------------- | :---------------------------------------------------------------------- |
| `bun run db:migrate`    | Generates and runs new database migrations based on `schema.prisma`.    |
| `bun run db:generate`   | Regenerates the Prisma Client (required after schema changes).          |
| `bun run db:studio`     | Starts standalone Prisma Studio to visually inspect and edit data.      |
| `bun run db:seed`       | Automatically clears the DB and seeds a complete set of mock data.      |
| `bun run db:seed:admin` | Seeds/Updates only the 5 core role accounts (Admin, HR, Leader, etc.).  |
| `bun run db:clear`      | Safely truncates and clears all data across all tables in the database. |

---

### 3. Utilities & Helpers

| Command                 | Description                                            |
| :---------------------- | :----------------------------------------------------- |
| `bun run hash-password` | Quickly hashes a password string for testing purposes. |
| `bun run build`         | Builds the Frontend application for Production.        |

---

## 📑 Documentation Index

Before writing new code or making structural changes, carefully review the design guidelines in the `docs/` directory:

- 📜 **[Code Standards](file:///docs/code-standards.md)**: Naming conventions, file structure, and standard abstractions.
- 📜 **[SOLID Principles](file:///docs/solid-principles.md)**: Class design, loose coupling, and reusability.
- 📜 **[Design Patterns](file:///docs/design-patterns.md)**: Implementation guides for Repository, Service, Strategy, and Factory patterns.
- 📜 **[System Architecture](file:///docs/system-architecture.md)**: Request/Response lifecycles and comprehensive Auth flow diagrams.
- 📜 **[Interface Contracts](file:///docs/interface-contracts.md)**: Standardized API contracts, DTOs, and response envelopes.
