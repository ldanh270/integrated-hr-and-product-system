import { useAuthStore } from "@/store/auth-store"
import { useSubsystemStore } from "@/store/subsystem-store"

import { useState } from "react"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  roles?: string[]
}

/**
 * Sidebar component
 * Reusable navigation panel with expand/collapse states.
 * Brand: HRP (Human Resource Platform)
 */
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const { getActiveSubsystemConfig } = useSubsystemStore()
  const activeSubsystemConfig = getActiveSubsystemConfig()
  const user = useAuthStore((s) => s.user)

  const navItems: NavItem[] = (activeSubsystemConfig?.sidebarItems || []).filter(
    (item: NavItem) => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    <aside
      className={`relative flex flex-col bg-background text-foreground border-r border-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand header */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold tracking-tighter shadow-sm">
            HRP
          </div>
          {!isCollapsed && (
            <span className="text-base font-medium tracking-tight whitespace-nowrap animate-fade-in">
              HRP Platform
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const dashboardPath = activeSubsystemConfig?.sidebarItems[0]?.path
          const isActive =
            location.pathname === item.path ||
            (item.path !== dashboardPath &&
              location.pathname.startsWith(item.path) &&
              item.path !== activeSubsystemConfig?.routePrefix)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!isCollapsed && (
                <span className="truncate transition-opacity duration-200">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed((p) => !p)}
        className="absolute -right-3 top-16 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-none hover:bg-muted transition-colors cursor-pointer"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={1.5} /> : <ChevronLeft size={14} strokeWidth={1.5} />}
      </button>
    </aside>
  )
}
