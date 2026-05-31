# Task Plan: Request & Application Approval Flow

## Goal
Implement a clean, robust, and SOLID-compliant request approval system where Admin, General Manager, HR, and Team Leaders have specific permissions to approve or reject different requests (Leave, OT, Password Reset, Recruitment Proposals), with full integration on backend, frontend, and Swagger docs.

## Current Phase
Completed

## Phases

### Phase 1: Requirements & Clarification
- [x] Research existing models (`Employee`, `Project`, `Application`, `PasswordResetRequest`, `RecruitmentProposal`)
- [x] Ask clarification questions and obtain user approval on requirements
- **Status:** complete

### Phase 2: Design & API Contracts
- [x] Define precise API endpoint specs (leave, password resets, proposals)
- [x] Design patterns definition (Strategy/Factory for permission resolver)
- [x] Write DB check queries for Team Leader validation
- **Status:** complete

### Phase 3: Backend Implementation
- [x] Implement `IApprovalService` / `ApprovalService` following SOLID
- [x] Implement validation check strategy for roles (Admin, GM, HR, Team Leader)
- [x] Add backend endpoints, middleware checks, and unit tests
- [x] Add Swagger documentation for approval endpoints
- **Status:** complete

### Phase 4: Frontend Implementation
- [x] Design and implement dynamic Approval Dashboard page (with filter by type, status)
- [x] Connect frontend APIs with backend approval endpoints
- [x] Enable approve/reject actions with reason modals
- **Status:** complete

### Phase 5: Verification & Delivery
- [x] Run backend tests and verify permissions
- [x] Conduct manual/Playwright UI testing for each role (Admin, HR, TL, Employee)
- [x] Verify build compiles without errors
- **Status:** complete

## Key Questions
1. Which types of requests are subject to approval? (Are they: Leave/OT applications, Password resets, and Recruitment proposals?)
2. Should Team Leaders be able to approve Password Reset requests or Recruitment proposals of their team members, or are those restricted to Admin/GM/HR?
3. In Team Leader approval, should we check if the applicant is a member of the project where the leader is active *at the time of application submission/processing*?
4. Do we need multi-level approval (e.g. Team Leader approves first, then HR, then Admin)? Or is a single approval from any authorized person sufficient to change status to "approved"?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use Strategy Pattern for Approval Verification | Allows easy addition of new roles/permissions without modifying existing logic (Open/Closed Principle) |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |
