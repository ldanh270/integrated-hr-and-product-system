import { APP_TYPE_META } from "@/components/features/attendance/applications/application-type-meta.config"
import { STATUS_TABS } from "@/components/features/attendance/applications/applications-status-tabs.config"
import type { StatusFilter } from "@/hooks/application/useMyApplications"

import { ChevronDown } from "lucide-react"

interface ApplicationsFiltersRowProps {
  statusFilter: StatusFilter
  typeFilter: string
  onStatusChange: (value: StatusFilter) => void
  onTypeChange: (value: string) => void
}

export function ApplicationsFiltersRow({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
}: ApplicationsFiltersRowProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex items-center gap-1 bg-muted p-1 rounded-full overflow-x-auto self-start">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative sm:ml-auto">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="pl-3 pr-8 py-2 border border-border rounded-full text-xs font-semibold text-muted-foreground bg-card focus:outline-none appearance-none"
        >
          <option value="all">Tất cả loại đơn</option>
          {Object.entries(APP_TYPE_META).map(([type, m]) => (
            <option key={type} value={type}>
              {m.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
    </div>
  )
}
