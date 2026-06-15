import { ConfirmProvider } from "@/components/common"
import { ROUTES } from "@/config/routes.config"
import { SUBSYSTEMS } from "@/config/subsystem"
import { privateRoutes, publicRoutes } from "@/routes"
import { useAuthStore } from "@/store/auth-store.ts"

import { Fragment, Suspense, lazy } from "react"

import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"
import { Toaster } from "sonner"

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 * Redirects to /hrm/dashboard if user does not have required roles
 */
const ProtectedRoute = ({
  children,
  requiredRoles,
}: {
  children: React.ReactNode
  requiredRoles?: string[]
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HRM.DASHBOARD} replace />
  }

  return <>{children}</>
}

/**
 * PublicRoute component
 * Redirects to /dashboard if user is already authenticated
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to={ROUTES.HRM.DASHBOARD} replace /> : <>{children}</>
}

/**
 * RootRedirect component
 * Redirects to /hrm/dashboard if authenticated, otherwise to /login
 */
const RootRedirect = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return <Navigate to={isAuthenticated ? "/hrm/dashboard" : "/login"} replace />
}

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <ConfirmProvider>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map((route, index) => {
              const Page = route.component
              const Layout = route.layout || Fragment

              return (
                <Route
                  key={`public-${index}`}
                  path={route.path}
                  element={
                    <PublicRoute>
                      <Layout>
                        <Page />
                      </Layout>
                    </PublicRoute>
                  }
                />
              )
            })}

            {/* Subsystem Redirects */}
            {SUBSYSTEMS.map((subsystem) => {
              const subsystemKey = subsystem.id.toUpperCase() as keyof typeof ROUTES
              const routeObj = ROUTES[subsystemKey]

              // Get from ROUTES object if available, otherwise get from sidebarItems
              let firstPath =
                subsystem.sidebarItems[0]?.path || `${subsystem.routePrefix}/dashboard`

              if (routeObj && typeof routeObj === "object") {
                const values = Object.values(routeObj)
                if (values.length > 0 && typeof values[0] === "string") {
                  firstPath = values[0]
                }
              }

              // Prevent infinite loop if the first path is the prefix itself (e.g. attendance)
              if (firstPath === subsystem.routePrefix) {
                return null
              }

              return (
                <Route
                  key={`redirect-${subsystem.id}`}
                  path={subsystem.routePrefix}
                  element={
                    <ProtectedRoute>
                      <Navigate to={firstPath} replace />
                    </ProtectedRoute>
                  }
                />
              )
            })}

            {/* Private Routes */}
            {privateRoutes.map((route, index) => {
              const Page = route.component
              const Layout = route.layout || Fragment

              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute requiredRoles={route.roles}>
                      <Layout>
                        <Page />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              )
            })}

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ConfirmProvider>
    </Router>
  )
}

export default App
