import { lazy } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

// Public routes
const publicRoutes = [
  { path: "/login", component: lazy(() => import("@/pages/auth/Login.tsx")), layout: null },
]

// Private routes
const privateRoutes = [
  {
    path: "/hrm/employees",
    component: lazy(() => import("@/pages/EmployeeList.tsx")),
    layout: MainLayout,
  },
  {
    path: "/employees/:id",
    component: lazy(() => import("@/pages/ViewEmployee.tsx")),
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
  // New Placeholder Modules
  {
    path: "/application/dashboard",
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/payroll/dashboard",
    component: lazy(() => import("@/pages/payroll/PayrollDashboard.tsx")),
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
  },
  {
    path: "/security/roles",
    component: lazy(() => import("@/pages/security/RolesManagement.tsx")),
    layout: MainLayout,
  },
  {
    path: "/security/users",
    component: lazy(() => import("@/pages/security/UsersManagement.tsx")),
    layout: MainLayout,
  },
  {
    path: "/security/activity-logs",
    component: lazy(() => import("@/pages/security/ActivityLogs.tsx")),
    layout: MainLayout,
  },
  {
    path: "/settings/dashboard",
    component: lazy(() => import("@/pages/settings/SettingsDashboard.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
