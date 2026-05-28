# Task Plan — Profile Feature (Backend + API Docs + Frontend)

## Goal
Build a complete Profile feature:
1. Backend: GET own profile, PATCH update profile, POST upload avatar (Cloudinary)
2. API Docs: Add all 3 endpoints to swagger.yaml
3. Frontend: Profile page at /hrm/profile with view + edit + avatar upload

## Architecture
- Pattern: Route → Controller → Service → Repository (existing style)
- Auth guard: `authenticate` middleware on all profile routes
- Avatar: multer (memory storage) → upload to Cloudinary → save url+id to Employee.avatar
- Zod validation on PATCH body
- `multipart/form-data` for avatar upload

## Stack
- Backend: Bun + Express 5 + Mongoose (already installed: bcryptjs, jsonwebtoken, multer needs install)
- File upload: multer + cloudinary SDK (need to install)
- Frontend: React 19 + TanStack/React Query + shadcn-style common components

---

## Phases

### Phase 1 — Backend Types & Interfaces
Status: complete
Files:
- `backend/src/types/profile.types.ts` [NEW]
- `backend/src/types/employee.types.ts` [MODIFY] — add avatar, dateOfBirth, nationalId, address, position, startDate

### Phase 2 — Zod Schema (validation)
Status: complete
Files:
- `backend/src/schemas/profile.schema.ts` [NEW]

### Phase 3 — Cloudinary Config
Status: complete
Files:
- `backend/src/configs/cloudinary.config.ts` [NEW]
- Install: multer, cloudinary, @types/multer

### Phase 4 — Repository
Status: complete
Files:
- `backend/src/repositories/profile.repository.ts` [NEW]

### Phase 5 — Service
Status: complete
Files:
- `backend/src/services/profile.service.ts` [NEW]

### Phase 6 — Controller
Status: complete
Files:
- `backend/src/controllers/profile.controller.ts` [NEW]

### Phase 7 — Route + Register
Status: complete
Files:
- `backend/src/routes/profile.route.ts` [NEW]
- `backend/src/index.ts` [MODIFY] — register /api/profile

### Phase 8 — Swagger API Docs
Status: complete
Files:
- `backend/swagger.yaml` [MODIFY] — add Profile tag + 3 endpoints

### Phase 9 — Frontend Types & API Client
Status: complete
Files:
- `frontend/src/types/profile.types.ts` [NEW]
- `frontend/src/lib/api/profile.api.ts` [NEW]

### Phase 10 — Frontend Hooks
Status: complete
Files:
- `frontend/src/hooks/use-profile.ts` [NEW]

### Phase 11 — Frontend Profile Page
Status: complete
Files:
- `frontend/src/pages/Profile.tsx` [NEW]
- `frontend/src/App.tsx` [MODIFY] — add /hrm/profile route
- `frontend/src/components/layouts/Sidebar.tsx` [MODIFY] — add Profile nav item

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

## Key Decisions
- Avatar: Cloudinary (already field in Employee schema). Use multer memoryStorage.
- PATCH: Only update allowed fields (fullName, phone, dateOfBirth, nationalId, address).
- File validation: image only, max 5MB.
- Response envelope: `{ status: "success", data: T }` consistent with existing pattern.
- Multer middleware: applied only to upload route.
