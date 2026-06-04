import type { EmployeeRole, EmployeeStatus, EmployeeType } from "./employee.types.ts"

// ─── DTOs ───────────────────────────────────────────────────────────────────

/**
 * Returned from GET /api/profile/me
 */
export interface ProfileDto {
  id: string
  fullName: string
  username: string
  email: string
  phone: string | null
  dateOfBirth: string | null // ISO date string
  nationalId: string | null
  address: string | null
  position: string | null
  role: EmployeeRole
  employeeType: EmployeeType
  status: EmployeeStatus
  startDate: string | null
  avatar: {
    url: string | null
    id: string | null
  }
  createdAt: string
  updatedAt: string
}

/**
 * Body for PATCH /api/profile/me
 * Only user-editable fields
 */
export interface UpdateProfileDto {
  fullName?: string
  phone?: string
  dateOfBirth?: string // ISO date string
  nationalId?: string
  address?: string
}

/**
 * Internal Employee document shape needed for profile operations
 */
export interface ProfileEmployeeDocument {
  id: string
  fullName: string
  username: string
  email: string
  phone: string | null
  dateOfBirth: Date | null
  nationalId: string | null
  address: string | null
  position: string | null
  role: EmployeeRole
  employeeType: EmployeeType
  status: EmployeeStatus
  startDate: Date | null
  avatarUrl: string | null
  avatarId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProfileEmployeeDocumentWithPassword extends ProfileEmployeeDocument {
  passwordHash: string
}

// ─── Repository Interface ────────────────────────────────────────────────────

export interface IProfileRepository {
  findById(empId: string): Promise<ProfileEmployeeDocument | null>
  findAuthById(empId: string): Promise<ProfileEmployeeDocumentWithPassword | null>
  updateProfile(empId: string, data: UpdateProfileDto): Promise<ProfileEmployeeDocument | null>
  updateAvatar(
    empId: string,
    avatar: { url: string; id: string },
  ): Promise<ProfileEmployeeDocument | null>
  updatePassword(empId: string, newPasswordHash: string): Promise<void>
}

// ─── Service Interface ───────────────────────────────────────────────────────

export interface IProfileService {
  getMyProfile(empId: string): Promise<ProfileDto>
  updateMyProfile(empId: string, data: UpdateProfileDto): Promise<ProfileDto>
  uploadAvatar(empId: string, fileBuffer: Buffer, mimeType: string): Promise<ProfileDto>
  changePassword(empId: string, oldPass: string, newPass: string): Promise<void>
}
