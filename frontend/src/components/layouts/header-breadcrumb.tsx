import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { useSubsystemStore } from "@/store/subsystem-store"

import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

/**
 * HeaderBreadcrumb — Displays current subsystem icon, subsystem name, and active page.
 */
export default function HeaderBreadcrumb() {
  const crumbs = useBreadcrumb()
  const activeSubsystemConfig = useSubsystemStore((s) => s.getActiveSubsystemConfig())

  if (!crumbs.length || !activeSubsystemConfig) return null

  const Icon = activeSubsystemConfig.icon

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm md:gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
        <Icon size={14} />
      </div>

      <div className="flex items-center text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <div key={`${crumb.label}-${index}`} className="flex items-center">
              {crumb.path && !isLast ? (
                <Link
                  to={crumb.path}
                  className="hidden transition-colors hover:text-foreground sm:inline-block"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-medium text-foreground"
                      : "hidden text-muted-foreground sm:inline-block"
                  }
                >
                  {crumb.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight
                  size={14}
                  className="mx-1 hidden text-muted-foreground/50 sm:inline-block md:mx-2"
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
