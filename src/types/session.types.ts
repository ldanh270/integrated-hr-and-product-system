export interface AuthInfo {
  jwt: string;
  role: string;
  employeeId: string;
}

export interface SessionData extends AuthInfo {
  expiresAt: number;
}
