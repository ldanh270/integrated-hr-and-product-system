import { ROUTES } from "@/config/routes.config.ts"

import { lazy, type ComponentType } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

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
  component?: ComponentType
  layout?: ComponentType | null
  permissions?: string[]
  children?: RouteConfig[]
}

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
  {
    path: "/profile/login-history",
    component: lazy(() => import("@/pages/security/LoginHistory.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance",
    component: lazy(() => import("@/pages/attendance/AttendanceDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/summary",
    component: lazy(() => import("@/pages/attendance/AttendanceSummary.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/work-schedules",
    component: lazy(() => import("@/pages/attendance/WorkSchedules.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/real-shift",
    component: lazy(() => import("@/pages/attendance/RealShift.tsx")),
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
    path: "/attendance/weekly-schedules",
    component: lazy(() => import("@/pages/attendance/WeeklySchedules.tsx")),
    layout: MainLayout,
  },
  {
    path: "/attendance/weekly-schedule-config",
    component: lazy(() => import("@/pages/attendance/WeeklyScheduleConfig.tsx")),
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
    path: "/application/create",
    component: lazy(() => import("@/pages/application/CreateApplicationPage.tsx")),
    layout: MainLayout,
  },
  {
    path: "/payroll/salary-components",
    component: lazy(() => import("@/pages/payroll/SalaryComponents.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: "/payroll/salary-variables",
    component: lazy(() => import("@/pages/payroll/SalaryVariables.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: "/payroll/cycle",
    component: lazy(() => import("@/pages/payroll/PayrollCycle.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: "/payroll/employee-salary",
    component: lazy(() => import("@/pages/payroll/EmployeeSalary.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: "/payroll/list",
    component: lazy(() => import("@/pages/payroll/PayrollManagement.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: "/payroll/payslip-templates",
    component: lazy(() => import("@/pages/payroll/PayslipTemplates.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
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
    permissions: ["security.read"],
  },
  {
    path: "/settings/roles",
    component: lazy(() => import("@/pages/security/RolesManagement.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: "/settings/role-permissions",
    component: lazy(() => import("@/pages/security/RolePermissions.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: "/security/users",
    component: lazy(() => import("@/pages/security/UsersManagement.tsx")),
    layout: MainLayout,
    permissions: ["security.read"],
  },
  {
    path: "/security/activity-logs",
    component: lazy(() => import("@/pages/security/ActivityLogs.tsx")),
    layout: MainLayout,
    permissions: ["audit.read"],
  },
  {
    path: "/settings/permissions",
    component: lazy(() => import("@/pages/security/PermissionMatrix.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: "/settings/dashboard",
    component: lazy(() => import("@/pages/settings/SettingsDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PERSONAL.SCHEDULE,
    component: lazy(() => import("@/pages/attendance/MySchedule.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PERSONAL.PAYSLIPS,
    component: lazy(() => import("@/pages/payroll/MyPayslips.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PERSONAL.PROJECTS,
    component: lazy(() => import("@/pages/project/ProjectDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/list",
    component: lazy(() => import("@/pages/project/ProjectList.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/:tab",
    component: lazy(() => import("@/pages/project/ProjectDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/:id/task/new",
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/task/new",
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/task",
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/task/:id",
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
