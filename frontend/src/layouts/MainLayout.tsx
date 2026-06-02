import Header from "@/components/layouts/Header.tsx"
import Sidebar from "@/components/layouts/Sidebar.tsx"
import { SUBSYSTEMS } from "@/config/subsystem"
import { useSubsystemStore } from "@/store/subsystem-store"

import type { ReactNode } from "react"
import { useEffect } from "react"

import { useLocation } from "react-router-dom"

/**
 * MainLayout component
 * Provides split-screen vertical navigation layout with Sidebar and top Header
 */
const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const { setActiveSubsystem } = useSubsystemStore()

  useEffect(() => {
    // Sync URL with activeSubsystem store
    const path = location.pathname
    // Find matching subsystem by routePrefix
    const matchingSubsystem = SUBSYSTEMS.find((sub) => path.startsWith(sub.routePrefix))
    if (matchingSubsystem) {
      setActiveSubsystem(matchingSubsystem.id)
    }
  }, [location.pathname, setActiveSubsystem])

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-secondary/30">{children}</main>
      </div>
    </div>
  )
}

export default MainLayout
