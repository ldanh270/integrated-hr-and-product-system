# Findings - Request and Application Approval Flow

## Existing Models & DB Structure

### 1. Employee
- Path: `backend/src/entities/Employee.ts`
- Roles defined in constants (`backend/src/configs/constants/entities.config.ts`):
  - `admin`
  - `general_manager`
  - `hr_manager`
  - `team_leader`
  - `employee`

### 2. Project
- Path: `backend/src/entities/product/Project.ts`
- Schema structure:
  - `teamLeaderId`: ObjectId (ref: Employee)
  - `members`: Array of `{ employeeId: ObjectId, joinedAt: Date, removedAt: Date }` (null `removedAt` indicates active member).
  - `status`: "planning", "active", "on_hold", "completed", "cancelled"

### 3. Application (Leave, OT, etc.)
- Path: `backend/src/entities/attendance/Application.ts`
- Fields:
  - `employeeId`: ObjectId (ref: Employee)
  - `type`: "leave", "overtime", "work_from_home", "shift_swap", "business_trip", "maternity", "paternity", "sick"
  - `status`: "pending", "approved", "rejected", "cancelled"
  - `approvedBy`: ObjectId (ref: Employee)
  - `approvedAt`: Date
  - `rejectReason`: String

### 4. PasswordResetRequest
- Path: `backend/src/entities/auth/PasswordResetRequest.ts`
- Fields:
  - `employeeId`: ObjectId (ref: Employee)
  - `status`: "pending", "approved", "rejected", "used", "expired"
  - `approvedBy`: ObjectId (ref: Employee)

### 5. RecruitmentProposal
- Path: `backend/src/entities/recruitment/RecruitmentProposal.ts`
- Fields:
  - `requestedBy`: ObjectId (ref: Employee)
  - `status`: "pending", "approved", "rejected", "closed"

---

## Existing API Flow & Design Patterns
- **Routes:** Connect Express routes to Controllers. Use `authenticate` and `authorizeRoles` middlewares.
- **Controllers:** Validate inputs using Zod, extract user from `req.user`, and call Services.
- **Services:** Execute business rules. Check permissions (e.g. if Team Leader can approve).
- **Repositories:** Interact with MongoDB/Mongoose.
- **DTOs:** Typed inputs for services.
- **API Envelope:** `ApiResponse<T>`:
  ```json
  { "data": T | null, "error": { "message": string, "code": string } | null, "meta": any }
  ```
