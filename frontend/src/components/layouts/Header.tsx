import { useAuth } from "@/hooks/use-auth.ts"
import { useAuthStore } from "@/store/auth-store.ts"
import { useSubsystemStore } from "@/store/subsystem-store"

import { useState } from "react"

import { Bell, History, LogOut, MessageSquare, User } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/config/routes.config"
import SubsystemDropdown from "@/components/layouts/SubsystemDropdown"

/**
 * Header component
 * Sticky top bar with page title, sub-tabs, notification bell, and user profile dropdown.
 */
export default function Header() {
  const navigate = useNavigate()
  const { logout, isLoggingOut } = useAuth()
  const { user, isAuthenticated } = useAuthStore()
  const { getActiveSubsystemConfig } = useSubsystemStore()
  const [activeTab, setActiveTab] = useState<"personal" | "summary">("personal")
  const [showDropdown, setShowDropdown] = useState(false)

  const activeSubsystemConfig = getActiveSubsystemConfig()

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.AUTH.LOGIN)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-border bg-card text-foreground px-5 flex items-center shadow-sm">
      <div className="flex w-full items-center justify-between">
        {/* Left: title + sub-tabs */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight leading-none">
              {activeSubsystemConfig?.name || "Hệ thống HRP"}
            </h1>
          </div>
          {/* Sub-tabs */}
          <div className="flex items-center gap-4 text-xs">
            {(["personal", "summary"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-0.5 font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "personal" ? "Cá nhân" : "Tổng hợp"}
              </button>
            ))}
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-3">
          <SubsystemDropdown />

          {/* Notification bell */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          <div className="h-5 w-px bg-border" />

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-2 text-left focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden flex-col lg:flex leading-none">
                <span className="text-xs font-semibold">{user?.fullName || "Lê Đức Anh"}</span>
                <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                  {user?.role || "Nhân viên"}
                </span>
              </div>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <p className="text-[10px] text-muted-foreground">Đăng nhập với</p>
                  <p className="text-xs font-bold truncate mt-0.5">{user?.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to={ROUTES.HRM.PROFILE}
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    <User size={13} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    to="#"
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    <History size={13} />
                    <span>Lịch sử đăng nhập</span>
                  </Link>
                  <Link
                    to="#"
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>Đóng góp ý kiến</span>
                  </Link>
                </div>

                <div className="border-t border-border/60 my-1"></div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={13} />
                  <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
