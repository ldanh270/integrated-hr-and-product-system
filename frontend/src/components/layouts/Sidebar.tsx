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
  permissions?: string[]
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
    (item: NavItem) => !item.permissions || (user && item.permissions.every((p: string) => user.permissions.includes(p))),
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
          const dashboardPath = activeSubsystemConfig?.sidebarItems[0]?.path?.split("?")[0]
          
          let isActive = false
          const [itemPathname, itemQuery] = item.path.split("?")
          
          const isPathMatch = 
            location.pathname === itemPathname ||
            (itemPathname !== dashboardPath &&
              location.pathname.startsWith(itemPathname) &&
              itemPathname !== activeSubsystemConfig?.routePrefix)
              
          if (isPathMatch) {
            if (itemQuery) {
              const itemParams = new URLSearchParams(itemQuery)
              const currentParams = new URLSearchParams(location.search)
              isActive = true
              for (const [key, value] of itemParams.entries()) {
                if (currentParams.get(key) !== value) {
                  isActive = false
                  break
                }
              }
            } else {
              isActive = true
              const currentParams = new URLSearchParams(location.search)
              if (currentParams.toString() !== "") {
                const betterMatchExists = navItems.some(otherItem => {
                  if (otherItem === item) return false
                  const [otherPathname, otherQuery] = otherItem.path.split("?")
                  if (otherPathname !== itemPathname || !otherQuery) return false
                  const otherParams = new URLSearchParams(otherQuery)
                  for (const [key, value] of otherParams.entries()) {
                    if (currentParams.get(key) !== value) return false
                  }
                  return true
                })
                if (betterMatchExists) isActive = false
              }
            }
          }
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={effectiveCollapsed ? item.name : undefined}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!effectiveCollapsed && (
                <span className="truncate transition-opacity duration-200">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Footer (User Menu) */}
      <div className="border-t border-border p-4">
        <UserMenu />
      </div>
    </aside>
  )
}
