import Header from "@/components/layouts/Header.tsx"
import Sidebar from "@/components/layouts/Sidebar.tsx"
import type { ReactNode } from "react"

/**
 * MainLayout component
 * Provides split-screen vertical navigation layout with Sidebar and top Header
 */
const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-secondary/30">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
