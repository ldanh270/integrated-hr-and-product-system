import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { IHoliday } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { Loader2, Pencil, Trash2 } from "lucide-react"

interface HolidaysGridProps {
  year: number
  holidays: IHoliday[] | undefined
  isLoading: boolean
  isAdmin: boolean
  onEdit: (holiday: IHoliday) => void
  onDelete: (holiday: IHoliday) => void
}

export function HolidaysGrid({
  year,
  holidays,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
}: HolidaysGridProps) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!holidays?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Chưa có ngày lễ nào trong năm {year}.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {holidays.map((holiday) => (
        <div key={holiday.id} className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{holiday.name}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {formatDate(holiday.date)}
              </p>
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Sửa ngày lễ"
                  onClick={() => onEdit(holiday)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-xs"
                  aria-label="Xóa ngày lễ"
                  onClick={() => onDelete(holiday)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
          <p className="mt-3 w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            {getHolidayTypeLabel(holiday.type)}
          </p>
        </div>
      ))}
    </div>
  )
}
