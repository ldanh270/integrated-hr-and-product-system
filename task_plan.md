# Frontend Hardcode Audit Plan

## Goal
Scan the entire frontend codebase for hardcoded links, route paths, and reusable variables. Move them into centralized constants, and enforce the import rule (`../` for `.d.ts`, `@/` for `.ts` / `.tsx`).

## Phases
- [x] Phase 1: Identify all files in `frontend/src` for scanning (components, pages, services).
- [x] Phase 2: Audit files, identifying hardcoded strings to centralize.
- [x] Phase 3: Create or update centralized configuration files.
- [x] Phase 4: Refactor components to use constants and fix import paths.
- [x] Phase 5: Build and verify.

## Current Status
- Current Phase: All Phases Complete
- Status: complete

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
