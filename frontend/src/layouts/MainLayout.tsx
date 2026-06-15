import Header from "@/components/layouts/Header"
import Sidebar from "@/components/layouts/Sidebar"
import { SUBSYSTEMS } from "@/config/subsystem"
import { useSubsystemStore } from "@/store/subsystem-store"

import type { ReactNode } from "react"
import { useEffect } from "react"

import { useLocation } from "react-router-dom"

interface MainLayoutProps {
  children?: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { setActiveSubsystem } = useSubsystemStore()

  // Sync active subsystem based on current URL
  useEffect(() => {
    const currentPath = location.pathname
    // Find the subsystem whose routePrefix matches the current path
    const matchedSubsystem = SUBSYSTEMS.find((sub) => currentPath.startsWith(sub.routePrefix))
    if (matchedSubsystem) {
      setActiveSubsystem(matchedSubsystem.id)
    }
  }, [location.pathname, setActiveSubsystem])

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar className="hidden md:flex shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
