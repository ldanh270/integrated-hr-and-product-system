import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CircleDollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<any>
}

/**
 * Sidebar component
 * Reusable navigation panel with expand/collapse states.
 * Brand: HRP (Human Resource Platform)
 */
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const navItems: NavItem[] = [
    { name: "Tổng quan", path: "/hrm/dashboard", icon: LayoutDashboard },
    { name: "Nhân sự", path: "/hrm/employees", icon: Users },
    { name: "Tuyển dụng", path: "/hrm/applications", icon: Briefcase },
    { name: "Tính lương", path: "/hrm/payroll", icon: CircleDollarSign },
    { name: "Cấu hình", path: "/hrm/settings", icon: Settings },
  ]

  return (
    <aside
      className={`relative flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${
        isCollapsed ? "w-[60px]" : "w-60"
      }`}
    >
      {/* Brand header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Logo mark */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-extrabold shadow">
            HRP
          </div>
          {!isCollapsed && (
            <span className="text-sm font-bold tracking-tight whitespace-nowrap animate-fade-in">
              HR Platform
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/hrm/dashboard" && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70"
              }`}
            >
              <Icon size={16} className="shrink-0" />
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
        className="absolute -right-3 top-[52px] flex h-5.5 w-5.5 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent transition-colors cursor-pointer"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
