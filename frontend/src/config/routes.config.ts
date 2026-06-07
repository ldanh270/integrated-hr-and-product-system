export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
  },
  HRM: {
    DASHBOARD: "/hrm/dashboard",
    PROFILE: "/hrm/profile",
    EMPLOYEES: "/hrm/employees",
  },
  APPLICATION: {
    DASHBOARD: "/application/dashboard",
  },
  ATTENDANCE: {
    DASHBOARD: "/attendance",
    MY_SCHEDULE: "/attendance/my-schedule",
    APPLICATIONS: "/attendance/applications",
    SHIFTS: "/attendance/shifts",
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
    ROLES: "/security/roles",
    USERS: "/security/users",
    ACTIVITY_LOGS: "/security/activity-logs",
  },
  SETTINGS: {
    DASHBOARD: "/settings/dashboard",
  },
} as const
