import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SUBSYSTEMS } from "@/config/subsystem"
import type { SubsystemId } from "@/config/subsystem"
import { useSubsystemStore } from "@/store/subsystem-store"

import { ChevronRight, LayoutGrid } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SubsystemDropdown() {
  const navigate = useNavigate()

  const { activeSubsystem, setActiveSubsystem } = useSubsystemStore()

  const handleSelectSubsystem = (subsystemId: string, routePrefix: string) => {
    setActiveSubsystem(subsystemId as SubsystemId)
    navigate(routePrefix)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary transition-colors cursor-pointer text-sm font-medium">
          <LayoutGrid size={16} className="text-muted-foreground" />
          <span>Phân hệ</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl mt-2">
        <div className="grid grid-cols-1 gap-1 max-h-[70vh] overflow-y-auto">
          {SUBSYSTEMS.map((subsystem) => {
            const Icon = subsystem.icon
            const isActive = activeSubsystem === subsystem.id

            return (
              <DropdownMenuItem
                key={subsystem.id}
                onClick={() => handleSelectSubsystem(subsystem.id, subsystem.routePrefix)}
                className={`flex items-start gap-3 w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer group ${
                  isActive
                    ? "bg-primary/10 border border-primary/20 focus:bg-primary/10 focus:border-primary/20 focus:text-foreground"
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
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
