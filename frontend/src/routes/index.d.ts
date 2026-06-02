declare const publicRoutes: {
  path: string
  component: import("react").LazyExoticComponent<typeof import("../pages/auth/Login.tsx").default>
  layout: null
}[]
declare const privateRoutes: {
  path: string
  component: import("react").LazyExoticComponent<typeof import("../pages/Dashboard.tsx").default>
  layout: import("react").LazyExoticComponent<
    ({
      children,
    }: {
      children: import("react").ReactNode
    }) => import("react/jsx-runtime").JSX.Element
  >
}[]
export { privateRoutes, publicRoutes }
