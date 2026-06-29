export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  bankName?: string
  bankAccountNumber?: string
  taxNumber?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface ChangePasswordInput {
  currentPassword?: string
  newPassword: string
}

export interface LinkEmployeeInput {
  employeeId: string
  accessCode: string
}
