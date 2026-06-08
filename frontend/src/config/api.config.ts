export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  PAYROLL: {
    BASE: "/payrolls",
    MY_PAYSLIPS: "/payrolls/my/payslips",
    GENERATE: "/payrolls/generate",
    SALARY_COMPONENTS: "/salary-components",
    PAYSLIP_TEMPLATES: "/payslip-templates",
    EMPLOYEE_SALARY_CONFIG: "/employees",
  },
} as const
