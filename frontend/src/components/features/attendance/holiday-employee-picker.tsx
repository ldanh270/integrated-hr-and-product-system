import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { Search } from "lucide-react"

interface Props {
  employees: Employee[]
  selectedIds: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggle: (id: string) => void
}

/**
 * Multi-select employee list for scoped holiday creation.
 */
export function HolidayEmployeePicker({
  employees,
  selectedIds,
  search,
  onSearchChange,
  onToggle,
}: Props) {
  const filtered = employees.filter((emp) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return emp.fullName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-2">
      <Label>Nhóm nhân viên ({selectedIds.length} đã chọn)</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full"
          placeholder="Tìm nhân viên..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {filtered.map((emp) => {
          const selected = selectedIds.includes(emp.id)
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => onToggle(emp.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
              )}
            >
              <span className="font-medium">{emp.fullName}</span>
              <span className="block text-xs text-muted-foreground">
                {emp.position || emp.email}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Không tìm thấy nhân viên
          </p>
        )}
      </div>
    </div>
  )
}
