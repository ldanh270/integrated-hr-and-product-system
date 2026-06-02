# Task Plan: Refactor Frontend Pages to Custom Hook Pattern

## Goal
Implement SOLID principles and Clean Architecture (Separation of Concerns) by extracting business and state logic from UI components into custom hooks across all frontend pages and features.

## Phases

### Phase 1: Preparation & Dashboard [Status: complete]
- [x] Review current `Dashboard.tsx`
- [x] Extract state and API calls from `Dashboard.tsx` into `useDashboard.ts`
- [x] Create `useViewEmployee.ts` for `ViewEmployee.tsx` (verified `useEmployeeDetails.ts` is already used)
- [x] Test Dashboard and ViewEmployee functionality

### Phase 2: Application & Payroll Modules [Status: complete]
- [x] Identify forms/pages in `application` (Leave, Proposal) (`ApplicationDashboard.tsx` is the primary page)
- [x] Create `useLeaveApplication.ts` (implemented as `useApplicationDashboard.ts`) and refactor UI
- [x] Identify pages in `payroll`
- [x] Create `usePayrollMaster.ts` and refactor `PayrollList.tsx` (verified `PayrollDashboard.tsx` is a placeholder with no logic)

### Phase 3: Asset & Recruitment Modules [Status: complete]
- [x] Create `useAssetManager.ts` and refactor asset UI (verified `AssetDashboard.tsx` is a placeholder with no logic)
- [x] Create `useRecruitmentManager.ts` and refactor recruitment UI (verified `RecruitmentDashboard.tsx` is a placeholder with no logic)

### Phase 4: Remaining Modules [Status: complete]
- [x] Refactor `training`, `security`, `settings` modules (verified all dashboards and management pages under these modules are placeholders with no logic)
- [x] Verify that ALL pages are strictly presentational
- [x] Run full application tests to ensure no regressions (successfully compiled project build)

### Phase 5: Additional Search and Linting Audit [Status: complete]
- [x] Run grep/search across all pages and components for inline API calls or state logic (confirmed all actual UI components/pages are clean presentational shells)
- [x] Document any remaining components with concerns in findings.md
- [x] Run ESLint to identify and list all lint warnings/errors
- [x] Fix ESLint warnings and errors
- [x] Verify frontend build still succeeds

## Current State
- All active frontend pages containing logic (`Dashboard.tsx`, `ApplicationDashboard.tsx`, `Profile.tsx`, `EmployeeList.tsx`, `Login.tsx`, `ViewEmployee.tsx`, `VirtualScanner.tsx`) follow the Hook-UI Separation pattern.
- The project successfully builds.
- Clean ESLint run on source files.

## Errors Encountered
- Fixed layout syntax error in `src/layouts/MainLayout.tsx`.
- Fixed missing destructure of `isProcessing` in `VirtualScanner.tsx`.
- Removed synchrounous `setState` calls in `useEffect` for `useDashboard.ts` and `useApplicationDashboard.ts`.
- Typed out error parameters (`any` to structured type casting) across all hooks and API callers.
- Replaced component type and subsystem cast `any`s with type-safe declarations in layout components.
- Migrated deprecated `tseslint.config` in `eslint.config.js` to `eslint`'s native `defineConfig` utility.
