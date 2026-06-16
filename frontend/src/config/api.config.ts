export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
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
    GENERATE_PREVIEW: "/schedules/generate/preview",
    GENERATE: "/schedules/generate",
    SETTINGS: "/schedules/settings",
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
  HOLIDAYS: {
    BASE: "/holidays",
  },
  WEEKLY_SCHEDULE_TEMPLATES: {
    BASE: "/weekly-schedule-templates",
    APPLY: (id: string) => `/weekly-schedule-templates/${id}/apply`,
  },
} as const
