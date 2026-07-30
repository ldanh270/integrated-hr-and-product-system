import Sidebar from "@/components/layouts/Sidebar"
import HeaderBreadcrumb from "@/components/layouts/header-breadcrumb"
import NotificationPanel from "@/components/layouts/notification-panel"
import ThemeToggle from "@/components/layouts/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/store/auth-store.ts"
import { useSidebarStore } from "@/store/sidebar-store"

import { useState } from "react"

import { Menu, PanelLeft } from "lucide-react"

/**
 * Header component
 * Slim orchestrator managing mobile menu, sidebar toggle, breadcrumb, and actions.
 * Height: 72px (h-18)
 */
export default function Header() {
  const { isAuthenticated } = useAuthStore()
  const { toggleSidebar } = useSidebarStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isAuthenticated) return null

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-border bg-background px-4 text-foreground shadow-none md:px-6">
      <div className="flex w-full items-center justify-between">
        {/* Left: Mobile Trigger + Desktop Toggle + Breadcrumb */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="-ml-2 text-muted-foreground">
                  <Menu size={20} strokeWidth={1.5} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r-0 p-0">
                <Sidebar
                  isMobile
                  onNavClick={() => {
                    setMobileMenuOpen(false)
                  }}
                  className="h-full border-r-0"
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden items-center md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="-ml-2 text-muted-foreground"
              aria-label="Toggle Sidebar"
            >
              <PanelLeft size={20} strokeWidth={1.5} />
            </Button>
          </div>

          <div className="mx-1 h-5 w-px bg-border hidden md:block" />

          <HeaderBreadcrumb />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <NotificationPanel />
        </div>
      </div>
    </header>
  )
}
