# Task Plan — Subsystem Header Dropdown

## Goal
Tách hệ thống thành 6 phân hệ với dropdown switcher trên header, dynamic sidebar, và route restructuring.

## Status: COMPLETE

---

## Phase 1: Config + Store
**Status:** `complete`

## Phase 2: SubsystemDropdown Component
**Status:** `complete`

## Phase 3: Header Modification
**Status:** `complete`

## Phase 4: Sidebar Dynamic
**Status:** `complete`

## Phase 5: Route Restructuring
**Status:** `complete`

## Phase 6: Placeholder Pages
**Status:** `complete`

## Phase 7: Verification
**Status:** `complete`

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Missing `useSubsystemStore` import in Header | 1 | Added import statement |
| Type-only import error for `LucideIcon`, `SubsystemId`, `SubsystemConfig` | 1 | Changed to `import type { ... }` |
| Accidentally removed `lucide-react` icons in Header.tsx | 1 | Restored imports for Bell, User, etc. |
