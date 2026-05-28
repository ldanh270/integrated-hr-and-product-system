import { privateRoutes, publicRoutes } from "@/routes"

import { Fragment, Suspense, lazy } from "react"

import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

const App = () => {
  const allRoutes = [...publicRoutes, ...privateRoutes]

  return (
    <Router>
      <Suspense fallback={<div className="container">Loading...</div>}>
        <Routes>
          {allRoutes.map((route, index) => {
            const Page = route.component
            const Layout = route.layout || Fragment

            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>
                }
              />
            )
          })}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
