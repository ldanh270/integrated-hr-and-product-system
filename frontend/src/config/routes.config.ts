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
  SUBSYSTEMS: {
    ATTENDANCE: "/attendance",
  },
  PAYROLL: {
    DASHBOARD: "/payroll/dashboard",
    LIST: "/payroll/list",
    SALARY_COMPONENTS: "/payroll/salary-components",
    PAYSLIP_TEMPLATES: "/payroll/payslip-templates",
    CYCLE: "/payroll/cycle",
    EMPLOYEE_SALARY: "/payroll/employee-salary",
    CUSTOM_FIELDS: "/payroll/custom-fields",
    MY_PAYSLIPS: "/payroll/my-payslips",
  },
} as const
