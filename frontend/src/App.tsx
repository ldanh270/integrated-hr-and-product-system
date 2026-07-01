import { ConfirmProvider } from "@/components/common"
import { API_ENDPOINTS } from "@/config/api.config"
import { ROUTES } from "@/config/routes.config"
import { SUBSYSTEMS } from "@/config/subsystem.config"
import apiClient from "@/lib/api-client"
import { setNavigate } from "@/lib/router-navigator"
import { type RouteConfig, privateRoutes, publicRoutes } from "@/routes"
import { useAuthStore } from "@/store/auth-store.ts"

import { Fragment, type ReactNode, Suspense, lazy, useEffect, useState } from "react"

import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom"
import { Toaster } from "sonner"

/**
 * Injects the React Router `navigate` function into the router-navigator singleton.
 * Must be rendered inside <Router> so that `useNavigate` is available.
 * Renders nothing — purely a side-effect component.
 */
const NavigatorInjector = () => {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  return null
}

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 * Redirects to /personal if user does not have required roles
 */
const ProtectedRoute = ({
  children,
  requiredPermissions,
}: {
  children: React.ReactNode
  requiredPermissions?: string[]
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isChecking, setIsChecking] = useState(!isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      apiClient
        .get(API_ENDPOINTS.AUTH.ME)
        .then((res) => {
          setAuth(res.data.data.employee)
        })
        .catch(() => {})
        .finally(() => {
          setIsChecking(false)
        })
    }
  }, [isAuthenticated, setAuth])

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  if (requiredPermissions && user) {
    const hasPermission = requiredPermissions.every((p) => user.permissions?.includes(p))
    if (!hasPermission) {
      return <Navigate to={ROUTES.HRM.DASHBOARD} replace />
    }
  }

  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to={ROUTES.PERSONAL.BASE} replace /> : <>{children}</>
}

/**
 * RootRedirect component
 * Redirects to /personal if authenticated, otherwise to /login
 */
const RootRedirect = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return <Navigate to={isAuthenticated ? ROUTES.PERSONAL.BASE : ROUTES.AUTH.LOGIN} replace />
}

const renderPrivateRoute = (route: RouteConfig, index: number, keyPrefix: string): ReactNode => {
  const Layout = route.layout || Fragment

  if (route.children?.length) {
    return (
      <Route
        key={`${keyPrefix}-${index}`}
        path={route.path}
        element={
          <ProtectedRoute requiredPermissions={route.permissions}>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        {route.children.map((child, ci) => renderPrivateRoute(child, ci, `${keyPrefix}-${index}`))}
      </Route>
    )
  }

  if (!route.component) return null
  const Page = route.component
  return (
    <Route
      key={`${keyPrefix}-${index}`}
      path={route.path}
      element={
        <ProtectedRoute requiredPermissions={route.permissions}>
          <Layout>
            <Page />
          </Layout>
        </ProtectedRoute>
      }
    />
  )
}

const App = () => {
  return (
    <Router>
      <NavigatorInjector />
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

            {SUBSYSTEMS.map((subsystem) => {
              const firstPath =
                subsystem.sidebarItems[0]?.path || `${subsystem.routePrefix}/dashboard`

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

            {privateRoutes.map((route, index) => renderPrivateRoute(route, index, "private"))}

            <Route
              path={ROUTES.ATTENDANCE.MY_SCHEDULE}
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PERSONAL.SCHEDULE} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PAYROLL.MY_PAYSLIPS}
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PERSONAL.PAYSLIPS} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROJECT.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PERSONAL.PROJECTS} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PERSONAL.BASE}
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PERSONAL.SCHEDULE} replace />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ConfirmProvider>
    </Router>
  )
}

export default App
