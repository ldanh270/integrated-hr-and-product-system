# HRP Frontend Application

This is the User Interface (SPA) for the Integrated HR & Product Management (HRP) project, engineered on the most modern React ecosystem available.

## 🛠️ Core Technologies

- **Framework:** `React 19` + `Vite 8` (Ultra-fast build times, instantaneous Hot Module Replacement).
- **Language:** `TypeScript` (Strict type-safety synchronized seamlessly with backend DTOs).
- **Styling:** `Tailwind CSS v3` + `Prettier plugin` (Utility-first CSS with automatic deterministic class sorting).
- **State Management:** (TBD - `Zustand` for global application state & `React Query` for server state/caching).

## 📂 Directory Structure (Feature-Sliced Design)

The project architecture heavily utilizes the **Feature-Sliced Design** paradigm combined with Atomic Design to keep the codebase highly scalable and cleanly organized:

```text
src/
├── assets/       # Static assets (images, icons, fonts)
├── components/   # Shared UI components / Primitives (Button, Input, Table, Modal)
├── config/       # Global configurations and design tokens (e.g., attendance.config.ts)
├── features/     # Feature-sliced domain modules (Auth, Payroll, Attendance...)
│   └── auth/
│       ├── api/        # API calls specific to Auth
│       ├── components/ # Components exclusive to the Auth domain
│       ├── hooks/      # Custom hooks handling Auth logic
│       └── utils/      # Auth-specific utilities
├── hooks/        # Globally shared custom hooks (useWindowSize, useTheme...)
├── layouts/      # Main application layouts (Sidebar, Header, Main wrapper)
├── pages/        # Routable pages (composed of Layouts and Features)
├── services/     # Global API/Axios configurations, interceptors
├── types/        # Global TypeScript type definitions
└── utils/        # Generic utility functions (Date formatters, currency parsers...)
```

## 🎨 UI/UX & Styling Standards

- **Design System:** All colors and spacing constraints must strictly adhere to the **Semantic Design Tokens** predefined in the Tailwind configuration. Do NOT use hardcoded colors (e.g., Avoid `#FF0000`, use `bg-primary`, `text-destructive` instead).
- **Shapes & Border Radii:**
  - Interactive elements (`Button`, `Input`, `Badge`) must be fully rounded (`rounded-full`).
  - Large containers and wrappers (`Container`, `Card`) must use large rounded corners (`rounded-xl`).
  - Inner elements like Tables and smaller nested blocks should use slightly softer corners (`rounded-lg`).
- **Responsive Design:** Developed with a strict Mobile-First philosophy, ensuring flawless adaptability from mobile devices to ultra-wide desktop monitors.

## 🚀 Development Guide

You can run development and build scripts from inside the `frontend/` directory:

- `bun run dev`: Starts the Vite development server on port `5173`.
- `bun run build`: Compiles the React source code into static HTML/JS for Production deployment (outputs to the `dist/` folder).
- `bun run lint`: Runs ESLint and Prettier to verify syntax rules and enforce code formatting.

## 🔗 Backend Integration

All frontend API requests are configured to point to `http://localhost:5000` (configurable via `.env`).
During communication, the Frontend must strictly adhere to the **Interface Contracts** (API response interfaces such as `ApiResponse<T>`) defined in the documentation to prevent unexpected data mapping errors.
