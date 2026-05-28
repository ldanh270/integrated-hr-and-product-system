/**
 * Data Transfer Object for Login request
 */
export interface LoginDto {
  email: string
  password: string
}

/**
 * Data Transfer Object for successful authentication response
 */
export interface AuthResponseDto {
  token: string
  employee: {
    id: string
    email: string
    fullName: string
    role: string
  }
}

/**
 * Data Transfer Object for logout response
 */
export interface LogoutResponseDto {
  message: string
}
