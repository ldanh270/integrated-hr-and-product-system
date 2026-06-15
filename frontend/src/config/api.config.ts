export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VALIDATE_RESET_TOKEN: "/auth/validate-reset-token",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PAYROLL: {
    BASE: "/payrolls",
    MY_PAYSLIPS: "/payrolls/my/payslips",
    GENERATE: "/payrolls/generate",
    SETTINGS: "/payrolls/settings",
    SALARY_COMPONENTS: "/salary-components",
    PAYSLIP_TEMPLATES: "/payslip-templates",
    EMPLOYEE_SALARY_CONFIG: "/employees",
  },
  ATTENDANCE: {
    BASE: "/attendance",
    CHECK_IN: "/attendance/check-in",
    CHECK_OUT: "/attendance/check-out",
    SCAN: "/attendance/scan",
    EXPORT: "/attendance/export",
  },
  SHIFTS: {
    BASE: "/shifts",
  },
  SCHEDULES: {
    MY: "/schedules/my",
    MY_ALL: "/schedules/my/all",
    ASSIGN: "/schedules/assign",
    OVERRIDE: "/schedules/override",
    EMPLOYEE: (employeeId: string) => `/schedules/employee/${employeeId}`,
    EMPLOYEE_ALL: (employeeId: string) => `/schedules/employee/${employeeId}/all`,
  },
  SHIFT_CHANGE_REQUESTS: {
    BASE: "/shift-change-requests",
    MINE: "/shift-change-requests/mine",
  },
  APPROVALS: {
    BASE: "/approvals",
    APPLICATION: (id: string) => `/approvals/application/${id}`,
  },
  SECURITY: {
    DASHBOARD: "/security/dashboard",
    LOCKED_ACCOUNTS: "/security/locked-accounts",
    UNLOCK: (employeeId: string) => `/security/unlock/${employeeId}`,
    ACTIVITY_LOGS: "/auth/activity-logs",
    ACTIVITY_LOG_DETAIL: (id: string) => `/auth/activity-logs/${id}`,
  },
} as const
