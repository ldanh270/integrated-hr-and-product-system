import { privateRoutes, publicRoutes } from "@/routes"
import { useAuthStore } from "@/store/auth-store.ts"

import { Fragment, Suspense, lazy } from "react"

import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"
import { Toaster } from "sonner"

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * PublicRoute component
 * Redirects to /dashboard if user is already authenticated
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/hrm/dashboard" replace /> : <>{children}</>
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

          {/* Private Routes */}
          {privateRoutes.map((route, index) => {
            const Page = route.component
            const Layout = route.layout || Fragment

            return (
              <Route
                key={`private-${index}`}
                path={route.path}
                element={
                  <ProtectedRoute>
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
    </Router>
  )
}

export default App
