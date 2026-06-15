import { useAuthStore } from "@/store/auth-store"
import { useSubsystemStore } from "@/store/subsystem-store"

import { useState } from "react"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface SidebarProps {
  isMobile?: boolean
  onNavClick?: () => void
  className?: string
}

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  roles?: string[]
  subItems?: { name: string; path: string }[]
}

/**
 * Sidebar component
 * Reusable navigation panel with expand/collapse states.
 * Brand: HRP (Human Resource Platform)
 */
export default function Sidebar({ isMobile, onNavClick, className }: SidebarProps = {}) {
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
      className={`relative flex flex-col bg-primary text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-[90px]"
      } ${className || ""}`}
    >
      {/* Brand header */}
      <div className="flex h-16 w-full items-center justify-center border-b border-white/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-primary text-xs font-bold tracking-tighter shadow-sm">
          HRP
        </div>
      </div>

      {/* Collapse toggle (top icon) */}
      <div className="flex w-full items-center justify-center py-4">
        <button
          onClick={() => setIsCollapsed((p) => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center space-y-2 px-2 py-2 overflow-visible w-full">
        {navItems.map((item) => {
          // Improved active matching logic taking query params into account
          const searchParams = new URLSearchParams(location.search)
          const tab = searchParams.get("tab")
          
          const isActive = item.path.includes("?tab=") 
            ? location.pathname + location.search === item.path
            : location.pathname === item.path && !tab

          const Icon = item.icon

          const linkContent = (
            <Link
              key={item.path}
              to={item.path}
              title={item.name}
              onClick={onNavClick}
              className={`flex w-full flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-[11px] font-medium text-center leading-tight px-1 transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </Link>
          )

          if (item.subItems && item.subItems.length > 0) {
            return (
              <div key={item.path} className="relative group w-full">
                {linkContent}
                <div className="absolute left-[calc(100%+8px)] top-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col p-2 translate-x-2 group-hover:translate-x-0">
                  {item.subItems.map((subItem) => {
                    const isSubActive = location.pathname + location.search === subItem.path
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={onNavClick}
                        className={`px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors ${
                          isSubActive 
                            ? "bg-indigo-50 text-indigo-700" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          return linkContent
        })}
      </nav>
    </aside>
  )
}
