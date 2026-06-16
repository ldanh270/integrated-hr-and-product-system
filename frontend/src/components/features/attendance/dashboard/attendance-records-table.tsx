import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getAttendanceStatusLabel,
  getAttendanceStatusVariant,
} from "@/config/entities/attendance.config"
import { formatDate, formatTime } from "@/lib/utils"
import type { IAttendanceRecord } from "@/types/attendance.types"

import { Loader2 } from "lucide-react"

interface AttendanceRecordsTableProps {
  records: IAttendanceRecord[] | undefined
  isLoading: boolean
  isError: boolean
}

export function AttendanceRecordsTable({ records, isLoading, isError }: AttendanceRecordsTableProps) {
  return (
    <PageCard className="overflow-hidden p-0" noBorder={false}>
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Nhân viên
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Ngày
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Check In
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Check Out
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Giờ làm
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                Trạng thái
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap hidden lg:table-cell">
                Muộn/Sớm/OT
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-destructive">
                  Lỗi khi tải dữ liệu chấm công.
                </TableCell>
              </TableRow>
            ) : !records || records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Không có bản ghi nào trong khoảng thời gian đã chọn.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const workHours = Math.floor(record.totalWorkMinutes / 60)
                const workMins = record.totalWorkMinutes % 60

                return (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="px-4 py-4">
                      <p className="font-medium whitespace-nowrap">
                        {record.employee?.fullName ?? record.employeeId}
                      </p>
                      {record.employee?.email ? (
                        <p className="text-xs text-muted-foreground">{record.employee.email}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-sm">
                      {formatTime(record.checkInAt)}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-sm">
                      {formatTime(record.checkOutAt)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                      {record.totalWorkMinutes > 0
                        ? `${workHours}h${workMins > 0 ? ` ${workMins}m` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <StatusPill
                        label={getAttendanceStatusLabel(record.status)}
                        variant={getAttendanceStatusVariant(record.status)}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {record.lateMinutes > 0 ? (
                        <span className="text-warning">+{record.lateMinutes}m muộn </span>
                      ) : null}
                      {record.earlyLeaveMinutes > 0 ? (
                        <span className="text-warning">-{record.earlyLeaveMinutes}m sớm </span>
                      ) : null}
                      {record.overtimeMinutes > 0 ? (
                        <span className="text-info-foreground">+{record.overtimeMinutes}m OT</span>
                      ) : null}
                      {!record.lateMinutes && !record.earlyLeaveMinutes && !record.overtimeMinutes
                        ? "—"
                        : null}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PageCard>
  )
}
