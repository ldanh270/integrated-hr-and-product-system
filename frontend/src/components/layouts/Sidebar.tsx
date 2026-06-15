import SubsystemDropdown from "@/components/layouts/SubsystemDropdown"
import UserMenu from "@/components/layouts/user-menu"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"
import { useSubsystemStore } from "@/store/subsystem-store"

import { Link, useLocation } from "react-router-dom"

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  roles?: string[]
  subItems?: { name: string; path: string }[]
}

interface SidebarProps {
  className?: string
  isMobile?: boolean
  onNavClick?: () => void
}

/**
 * Sidebar component
 * Shadcn style layout with Team Switcher (SubsystemDropdown) at top, User Menu at bottom.
 */
export default function Sidebar({ className, isMobile, onNavClick }: SidebarProps = {}) {
  const location = useLocation()

  const { getActiveSubsystemConfig } = useSubsystemStore()
  const activeSubsystemConfig = getActiveSubsystemConfig()
  const user = useAuthStore((s) => s.user)
  const { isCollapsed } = useSidebarStore()

  const navItems: NavItem[] = (activeSubsystemConfig?.sidebarItems || []).filter(
    (item: NavItem) => !item.roles || (user && item.roles.includes(user.role)),
  )

  // Mobile mode effectively ignores 'isCollapsed' for layout purposes since it's a drawer
  const effectiveCollapsed = !isMobile && isCollapsed

  return (
    <aside
      className={`relative flex flex-col bg-background text-foreground border-r border-border transition-all duration-300 ${
        isMobile ? "w-full" : effectiveCollapsed ? "w-16" : "w-64"
      } ${className || ""}`}
    >
      {/* Sidebar Header (Team Switcher / Logo) */}
      <div className="flex h-14 items-center px-3 border-b border-border">
        <SubsystemDropdown />
      </div>

      {/* Sidebar Content (Navigation) */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
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
              title={effectiveCollapsed ? item.name : undefined}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!effectiveCollapsed && (
                <span className="truncate transition-opacity duration-200">{item.name}</span>
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

      {/* Sidebar Footer (User Menu) */}
      <div className="border-t border-border p-4">
        <UserMenu />
      </div>
    </aside>
  )
}
