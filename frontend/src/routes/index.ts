import { lazy } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

// Public routes
const publicRoutes = [
  { path: "/", component: lazy(() => import("@/pages/Dashboard.tsx")), layout: MainLayout },
  { path: "/login", component: lazy(() => import("@/pages/auth/Login.tsx")), layout: null },
]

// Private routes
const privateRoutes = [
  { path: "/dashboard", component: lazy(() => import("@/pages/Dashboard.tsx")), layout: MainLayout },
]

export { privateRoutes, publicRoutes }
