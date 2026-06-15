import { ROLE } from "@/config/entities/employee.config.ts"
import { lazy, type ComponentType } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

// Public routes
const publicRoutes = [
  { path: "/login", component: lazy(() => import("@/pages/auth/Login.tsx")), layout: null },
  {
    path: "/reset-password",
    component: lazy(() => import("@/pages/auth/ResetPassword.tsx")),
    layout: null,
  },
]

export interface RouteConfig {
  path: string
  component: ComponentType
  layout?: ComponentType | null
  roles?: string[]
}

// Private routes
const privateRoutes: RouteConfig[] = [
  {
    path: "/hrm/dashboard",
    component: lazy(() => import("@/pages/Dashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/employees",
    component: lazy(() => import("@/pages/EmployeeList.tsx")),
    layout: MainLayout,
  },

  {
    path: "/hrm/profile",
    component: lazy(() => import("@/pages/Profile.tsx")),
    layout: MainLayout,
  },
  // Attendance Module
  {
    path: "/attendance",
    component: lazy(() => import("@/pages/attendance/AttendanceDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/my-schedule",
    component: lazy(() => import("@/pages/attendance/MySchedule.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/applications",
    component: lazy(() => import("@/pages/attendance/Applications.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/shifts",
    component: lazy(() => import("@/pages/attendance/ShiftManagement.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/holidays",
    component: lazy(() => import("@/pages/attendance/Holidays.tsx")),
    layout: MainLayout,
  },
  {
    path: "/application/dashboard",
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/payroll/salary-components",
    component: lazy(() => import("@/pages/payroll/SalaryComponents.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },
  {
    path: "/payroll/salary-variables",
    component: lazy(() => import("@/pages/payroll/SalaryVariables.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },
  {
    path: "/payroll/cycle",
    component: lazy(() => import("@/pages/payroll/PayrollCycle.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },
  {
    path: "/payroll/employee-salary",
    component: lazy(() => import("@/pages/payroll/EmployeeSalary.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },

  {
    path: "/payroll/list",
    component: lazy(() => import("@/pages/payroll/PayrollManagement.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },

  {
    path: "/payroll/payslip-templates",
    component: lazy(() => import("@/pages/payroll/PayslipTemplates.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER],
  },
  {
    path: "/payroll/my-payslips",
    component: lazy(() => import("@/pages/payroll/MyPayslips.tsx")),
    layout: MainLayout,
  },
  {
    path: "/asset/dashboard",
    component: lazy(() => import("@/pages/asset/AssetDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/recruitment/dashboard",
    component: lazy(() => import("@/pages/recruitment/RecruitmentDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/training/dashboard",
    component: lazy(() => import("@/pages/training/TrainingDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/security/dashboard",
    component: lazy(() => import("@/pages/security/SecurityDashboard.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
  },
  {
    path: "/security/roles",
    component: lazy(() => import("@/pages/security/RolesManagement.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
  },
  {
    path: "/security/users",
    component: lazy(() => import("@/pages/security/UsersManagement.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
  },
  {
    path: "/security/activity-logs",
    component: lazy(() => import("@/pages/security/ActivityLogs.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
  },
  {
    path: "/security/permission-matrix",
    component: lazy(() => import("@/pages/security/PermissionMatrix.tsx")),
    layout: MainLayout,
    roles: [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER],
  },
  {
    path: "/settings/dashboard",
    component: lazy(() => import("@/pages/settings/SettingsDashboard.tsx")),
    layout: MainLayout,
  },
  // Project & Task Management Module
  {
    path: "/project/dashboard",
    component: lazy(() => import("@/pages/project/ProjectDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/list",
    component: lazy(() => import("@/pages/project/ProjectList.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/:id",
    component: lazy(() => import("@/pages/project/ProjectDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/:id/tasks/new",
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/tasks/:id",
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
