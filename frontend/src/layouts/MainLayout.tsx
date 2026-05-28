import Footer from "@/components/ui/layouts/Footer.tsx"
import Header from "@/components/ui/layouts/Header.tsx"

import { Outlet } from "react-router-dom"

const MainLayout = () => {
  return (
    <div className="min-h-screen">
      {/* TODO: Add Header */}
      <Header />
      <Outlet />
      {/* TODO: Add Footer */}
      <Footer />
    </div>
  )
}

export default MainLayout
