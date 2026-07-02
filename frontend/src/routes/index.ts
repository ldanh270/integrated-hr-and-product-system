import { ROUTES } from "@/config/routes.config.ts"

import { type ComponentType, lazy } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

const publicRoutes = [
  {
    path: ROUTES.AUTH.LOGIN,
    component: lazy(() => import("@/pages/auth/Login.tsx")),
    layout: null,
  },
  {
    path: ROUTES.AUTH.RESET_PASSWORD,
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
    path: ROUTES.HRM.EMPLOYEES,
    component: lazy(() => import("@/pages/EmployeeList.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.PROFILE,
    component: lazy(() => import("@/pages/Profile.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.LOGIN_HISTORY,
    component: lazy(() => import("@/pages/security/LoginHistory.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.BASE,
    component: lazy(() => import("@/pages/attendance/AttendanceDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.SUMMARY,
    component: lazy(() => import("@/pages/attendance/AttendanceSummary.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.WORK_SCHEDULES,
    component: lazy(() => import("@/pages/attendance/WorkSchedules.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.REAL_SHIFT,
    component: lazy(() => import("@/pages/attendance/RealShift.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.APPLICATIONS,
    component: lazy(() => import("@/pages/attendance/Applications.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.SHIFTS,
    component: lazy(() => import("@/pages/attendance/ShiftManagement.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULES,
    component: lazy(() => import("@/pages/attendance/WeeklySchedules.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULE_CONFIG,
    component: lazy(() => import("@/pages/attendance/WeeklyScheduleConfig.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.HOLIDAYS,
    component: lazy(() => import("@/pages/attendance/Holidays.tsx")),
    layout: MainLayout,
  },
  {
    path: "/application/manage",
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/application/all",
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/personal/applications",
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.APPLICATION.CREATE,
    component: lazy(() => import("@/pages/application/CreateApplicationPage.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PAYROLL.SALARY_COMPONENTS,
    component: lazy(() => import("@/pages/payroll/SalaryComponents.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.SALARY_VARIABLES,
    component: lazy(() => import("@/pages/payroll/SalaryVariables.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.CYCLE,
    component: lazy(() => import("@/pages/payroll/PayrollCycle.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.EMPLOYEE_SALARY,
    component: lazy(() => import("@/pages/payroll/EmployeeSalary.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.LIST,
    component: lazy(() => import("@/pages/payroll/PayrollManagement.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.PAYSLIP_TEMPLATES,
    component: lazy(() => import("@/pages/payroll/PayslipTemplates.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.ASSET.DASHBOARD,
    component: lazy(() => import("@/pages/asset/AssetDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.RECRUITMENT.DASHBOARD,
    component: lazy(() => import("@/pages/recruitment/RecruitmentDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.SECURITY.DASHBOARD,
    component: lazy(() => import("@/pages/security/SecurityDashboard.tsx")),
    layout: MainLayout,
    permissions: ["security.read"],
  },
  {
    path: ROUTES.SETTINGS.ROLES,
    component: lazy(() => import("@/pages/security/RolesManagement.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.SETTINGS.ROLE_PERMISSIONS,
    component: lazy(() => import("@/pages/security/RolePermissions.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.SECURITY.USERS,
    component: lazy(() => import("@/pages/security/UsersManagement.tsx")),
    layout: MainLayout,
    permissions: ["security.read"],
  },
  {
    path: ROUTES.SECURITY.ACTIVITY_LOGS,
    component: lazy(() => import("@/pages/security/ActivityLogs.tsx")),
    layout: MainLayout,
    permissions: ["audit.read"],
  },
  {
    path: ROUTES.SETTINGS.PERMISSIONS,
    component: lazy(() => import("@/pages/security/PermissionMatrix.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.SETTINGS.DASHBOARD,
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
    path: ROUTES.PROJECT.LIST,
    component: lazy(() => import("@/pages/project/ProjectList.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.DETAIL_TAB,
    component: lazy(() => import("@/pages/project/ProjectDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_NEW_WITH_ID,
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_NEW,
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_DETAIL,
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_DETAIL_WITH_ID,
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
