import { SUBSYSTEMS } from "@/config/subsystem"

import { useMemo } from "react"

import { useLocation } from "react-router-dom"

export interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * useBreadcrumb — Derives breadcrumb from current URL + subsystem config.
 * Returns [subsystemName, ...navItemName] trail.
 */
export function useBreadcrumb(): BreadcrumbItem[] {
  const location = useLocation()

  return useMemo(() => {
    const pathname = location.pathname

    const subsystem = SUBSYSTEMS.find((s) => pathname.startsWith(s.routePrefix))
    if (!subsystem) return []

    const navItem = subsystem.sidebarItems.find((item) => {
      if (pathname === item.path) return true
      // Avoid dashboard matching everything
      const isDashboard = item.path === subsystem.sidebarItems[0]?.path
      return !isDashboard && pathname.startsWith(item.path)
    })

    const crumbs: BreadcrumbItem[] = [
      { label: subsystem.name, path: subsystem.sidebarItems[0]?.path },
    ]

    if (navItem) {
      crumbs.push({ label: navItem.name })
    }

    return crumbs
  }, [location.pathname])
}
