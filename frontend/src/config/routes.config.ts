export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
  },
  HRM: {
    DASHBOARD: "/hrm/dashboard",
    PROFILE: "/hrm/profile",
    EMPLOYEES: "/hrm/employees",
    LOGIN_HISTORY: "/profile/login-history",
  },
  APPLICATION: {
    DASHBOARD: "/application/dashboard",
    CREATE: "/application/create",
  },
  ATTENDANCE: {
    DASHBOARD: "/attendance",
    SUMMARY: "/attendance/summary",
    MY_SCHEDULE: "/attendance/my-schedule",
    WORK_SCHEDULES: "/attendance/work-schedules",
    REAL_SHIFT: "/attendance/real-shift",
    APPLICATIONS: "/attendance/applications",
    SHIFTS: "/attendance/shifts",
    WEEKLY_SCHEDULES: "/attendance/weekly-schedules",
    WEEKLY_SCHEDULE_CONFIG: "/attendance/weekly-schedule-config",
    HOLIDAYS: "/attendance/holidays",
  },
  PAYROLL: {
    LIST: "/payroll/list",
    SALARY_COMPONENTS: "/payroll/salary-components",
    SALARY_VARIABLES: "/payroll/salary-variables",
    PAYSLIP_TEMPLATES: "/payroll/payslip-templates",
    CYCLE: "/payroll/cycle",
    EMPLOYEE_SALARY: "/payroll/employee-salary",
    MY_PAYSLIPS: "/payroll/my-payslips",
  },
  ASSET: {
    DASHBOARD: "/asset/dashboard",
  },
  RECRUITMENT: {
    DASHBOARD: "/recruitment/dashboard",
  },
  TRAINING: {
    DASHBOARD: "/training/dashboard",
  },
  SECURITY: {
    DASHBOARD: "/security/dashboard",
    USERS: "/security/users",
    ACTIVITY_LOGS: "/security/activity-logs",
  },
  SETTINGS: {
    DASHBOARD: "/settings/dashboard",
    ROLES: "/settings/roles",
    ROLE_PERMISSIONS: "/settings/role-permissions",
    PERMISSIONS: "/settings/permissions",
  },
  PROJECT: {
    LIST: "/project/list",
    POSITIONS: "/project/positions",
    DASHBOARD: "/project/dashboard",
    OVERVIEW: "/project/overview",
    ISSUES: "/project/issues",
    TASK_NEW: "/project/task/new",
    TASK_DETAIL: "/project/task",
  },
  PERSONAL: {
    BASE: "/personal",
    SCHEDULE: "/personal/schedule",
    PAYSLIPS: "/personal/payslips",
    PROJECTS: "/personal/projects",
  },
} as const
