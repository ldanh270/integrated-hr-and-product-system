import { lazy } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

// Public routes
const publicRoutes = [
  { path: "/login", component: lazy(() => import("@/pages/auth/Login.tsx")), layout: null },
]

// Private routes
const privateRoutes = [
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
    path: "/hrm/attendance",
    component: lazy(() => import("@/pages/attendance/AttendanceDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/attendance/my-schedule",
    component: lazy(() => import("@/pages/attendance/MySchedule.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/attendance/applications",
    component: lazy(() => import("@/pages/attendance/Applications.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/attendance/shifts",
    component: lazy(() => import("@/pages/attendance/ShiftManagement.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/attendance/holidays",
    component: lazy(() => import("@/pages/attendance/Holidays.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
