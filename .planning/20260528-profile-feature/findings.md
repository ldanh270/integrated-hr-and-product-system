# Findings — Profile Feature

## Existing Backend Architecture
- Pattern: Route → Controller → Service → Repository (constructor DI)
- Auth: JWT Bearer via `authenticate` middleware → `req.user = { empId, email, role }`
- Error: `AppError(message, statusCode, layer)` + global error handler
- Response: `{ status: "success", data: T }` or `{ status: "error", message: string }`
- DB: MongoDB via Mongoose, Bun runtime

## Employee Entity (relevant fields)
- `fullName`, `username`, `email`, `phone`, `dateOfBirth`, `nationalId`, `address`
- `avatar: { url: string, id: string }` ← Cloudinary already modeled
- `position`, `employeeType`, `startDate`, `endDate`, `status`, `role`
- `passwordHash` (select: false)

## Installed Packages
- bcryptjs, jsonwebtoken, mongoose, express 5, dotenv, cookie-parser
- swagger-ui-express, yamljs (swagger already set up at /api-docs)
- multer, cloudinary — NOT installed yet, need: `bun add multer cloudinary @types/multer`

## File Structure Pattern
- types/X.types.ts — Interfaces + DTOs
- schemas/X.schema.ts — Zod validation
- repositories/X.repository.ts — DB queries
- services/X.service.ts — Business logic
- controllers/X.controller.ts — HTTP adapter
- routes/X.route.ts — DI wiring + express.Router

## Frontend Architecture
- API calls: direct fetch/axios (need to check lib/api/)
- Auth store: Zustand `useAuthStore` → `{ user, isAuthenticated, token }`
- Common components: PageCard, SectionHeader, StatRow, IconBox, StatusPill, EmptyState
- Routing: React Router v6, MainLayout wraps /hrm/* routes

## Swagger
- Exists at backend/swagger.yaml, loaded at /api-docs
- Uses OpenAPI 3.0.0, components/schemas defined
- Components/securitySchemes: need to add BearerAuth
