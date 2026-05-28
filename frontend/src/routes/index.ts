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
    path: "/employees/:id",
    component: lazy(() => import("@/pages/ViewEmployee.tsx")),
    layout: MainLayout,
  },
  {
    path: "/hrm/profile",
    component: lazy(() => import("@/pages/Profile.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes }
