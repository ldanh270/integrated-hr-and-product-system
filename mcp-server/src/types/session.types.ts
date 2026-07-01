export interface AuthInfo {
  jwt: string
  role: string
  employeeId: string
  cookies?: string[]
}

export interface SessionData extends AuthInfo {
  expiresAt: number
}
