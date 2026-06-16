import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ATTENDANCE_STATUSES,
  getAttendanceStatusLabel,
  type IAttendanceStatus,
} from "@/config/entities/attendance.config"

interface AttendanceRecordsFiltersProps {
  startDate: string
  endDate: string
  statusFilter: IAttendanceStatus | "all"
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onStatusFilterChange: (value: IAttendanceStatus | "all") => void
}

export function AttendanceRecordsFilters({
  startDate,
  endDate,
  statusFilter,
  onStartDateChange,
  onEndDateChange,
  onStatusFilterChange,
}: AttendanceRecordsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="w-40 h-9 text-sm"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="w-40 h-9 text-sm"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusFilterChange(value as IAttendanceStatus | "all")}
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {ATTENDANCE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {getAttendanceStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
