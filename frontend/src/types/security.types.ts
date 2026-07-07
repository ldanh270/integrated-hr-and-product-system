export interface ActivityLogItem {
  id: string
  employeeId?: string | null
  employeeName?: string | null
  category: string
  actionType: string
  ipAddress?: string | null
  details?: string | null
  createdAt: string
}

export interface ActivityLogQuery {
  employeeId?: string
  category?: string
  actionType?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface PaginatedActivityLogsDto {
  data: ActivityLogItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SecuritySummaryDto {
  lockedAccountsCount: number
  failedLoginsToday: number
  successfulLoginsToday: number
  recentSecurityEvents: ActivityLogItem[]
  recentRoleEvents: ActivityLogItem[]
}

export interface LockedAccountItem {
  employeeId: string
  employeeName: string
  email: string
  failedLoginCount: number
  lockedUntil: string | null
}

export interface Permission {
  id: string
  name: string
  code: string
  module: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  isAdministrative: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  permissionsCount?: number
  employeesCount?: number
}
