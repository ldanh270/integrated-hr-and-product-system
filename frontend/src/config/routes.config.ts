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
    LIST: "/payroll/list",
    SALARY_COMPONENTS: "/payroll/salary-components",
    SALARY_VARIABLES: "/payroll/salary-variables",
    PAYSLIP_TEMPLATES: "/payroll/payslip-templates",
    CYCLE: "/payroll/cycle",
    EMPLOYEE_SALARY: "/payroll/employee-salary",

    MY_PAYSLIPS: "/payroll/my-payslips",
  },
} as const
