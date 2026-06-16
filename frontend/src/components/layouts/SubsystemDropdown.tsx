import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SUBSYSTEMS } from "@/config/subsystem.config"
import type { SubsystemId } from "@/config/subsystem.config"
import { useSidebarStore } from "@/store/sidebar-store"
import { useSubsystemStore } from "@/store/subsystem-store"

import { ChevronsUpDown } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SubsystemDropdown() {
  const navigate = useNavigate()
  const { activeSubsystem, setActiveSubsystem, getActiveSubsystemConfig } = useSubsystemStore()
  const { isCollapsed } = useSidebarStore()

  const activeConfig = getActiveSubsystemConfig()

  const handleSelectSubsystem = (subsystemId: string, routePrefix: string) => {
    setActiveSubsystem(subsystemId as SubsystemId)
    navigate(routePrefix)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isCollapsed ? "justify-center w-full" : "w-full justify-between"
          }`}
          title={isCollapsed ? activeConfig?.name : undefined}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center justify-center h-9.5 w-9.5 gap-3 p-2.5 rounded-md text-sm font-medium transition-all duration-150 bg-primary text-primary-foreground shadow-sm">
              {/* {ActiveIcon ? <ActiveIcon size={18} /> : <span className="font-bold">HRP</span>} */}
              <span className="font-bold text-xs">HRP</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden text-left leading-none">
                <span className="truncate font-semibold text-foreground">HRP Platform</span>
                <span className="truncate text-xs text-muted-foreground">
                  Integrated HR and Product{" "}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isCollapsed ? "center" : "end"}
        side="right"
        sideOffset={8}
        className="w-60 rounded-xl p-1 shadow-md mt-2 ml-3"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {SUBSYSTEMS.map((subsystem) => {
            const Icon = subsystem.icon
            const isActive = activeSubsystem === subsystem.id

            return (
              <DropdownMenuItem
                key={subsystem.id}
                onClick={() => handleSelectSubsystem(subsystem.id, subsystem.routePrefix)}
                className={`flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                    : "text-foreground focus:bg-muted"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span className="truncate text-sm font-medium">{subsystem.name}</span>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
