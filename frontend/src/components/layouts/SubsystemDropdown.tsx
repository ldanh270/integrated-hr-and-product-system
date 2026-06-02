import { ROUTES } from "@/config/routes.config"
import { SUBSYSTEMS } from "@/config/subsystem"
import type { SubsystemId } from "@/config/subsystem"
import { useSubsystemStore } from "@/store/subsystem-store"

import { useEffect, useRef, useState } from "react"

import { ChevronRight, LayoutGrid } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SubsystemDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { activeSubsystem, setActiveSubsystem } = useSubsystemStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelectSubsystem = (subsystemId: string, routePrefix: string) => {
    setActiveSubsystem(subsystemId as SubsystemId)
    setIsOpen(false)
    // Default navigate to the dashboard of that subsystem
    if (subsystemId === "attendance") {
      navigate(ROUTES.SUBSYSTEMS.ATTENDANCE)
    } else {
      navigate(`${routePrefix}/dashboard`)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary transition-colors cursor-pointer text-sm font-medium"
      >
        <LayoutGrid size={16} className="text-muted-foreground" />
        <span>Phân hệ</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
          <div className="grid grid-cols-1 gap-1 max-h-[70vh] overflow-y-auto">
            {SUBSYSTEMS.map((subsystem) => {
              const Icon = subsystem.icon
              const isActive = activeSubsystem === subsystem.id

              return (
                <button
                  key={subsystem.id}
                  onClick={() => handleSelectSubsystem(subsystem.id, subsystem.routePrefix)}
                  className={`flex items-start gap-3 w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer group ${
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary border border-transparent"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <span
                      className={`text-sm font-bold leading-none mb-1 ${isActive ? "text-primary" : "text-foreground"}`}
                    >
                      {subsystem.name}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {subsystem.description}
                    </span>
                  </div>

                  <div className="flex items-center h-8 shrink-0">
                    <ChevronRight
                      size={16}
                      className={
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground/50 group-hover:text-foreground"
                      }
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
