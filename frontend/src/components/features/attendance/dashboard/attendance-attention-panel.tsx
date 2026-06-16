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
import { formatDate } from "@/lib/utils"
import type { IAttendanceRecord } from "@/types/attendance.types"

import { AlertTriangle, Clock, TimerOff } from "lucide-react"

interface AttendanceAttentionPanelProps {
  openCheckoutToday: IAttendanceRecord[]
  attentionRecords: IAttendanceRecord[]
}

export function AttendanceAttentionPanel({
  openCheckoutToday,
  attentionRecords,
}: AttendanceAttentionPanelProps) {
  const lateOrEarlyCount = attentionRecords.filter(
    (record) => record.status === "late" || record.earlyLeaveMinutes > 0,
  ).length
  const overtimeCount = attentionRecords.filter((record) => record.overtimeMinutes > 0).length

  return (
    <PageCard padding="lg" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Cần xử lý</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Các bản ghi có dấu hiệu bất thường trong khoảng lọc hiện tại.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${openCheckoutToday.length} chưa checkout hôm nay`} variant="warning" />
          <StatusPill label={`${attentionRecords.length} bản ghi cần xem`} variant="info" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TimerOff className="h-4 w-4 text-warning" />
            Chưa checkout
          </div>
          <p className="mt-2 text-2xl font-bold">{openCheckoutToday.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Nhân viên đã vào ca nhưng chưa ra ca.</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Đi muộn / về sớm
          </div>
          <p className="mt-2 text-2xl font-bold">{lateOrEarlyCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Cần kiểm tra lý do hoặc đơn điều chỉnh.</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-info-foreground" />
            Làm thêm giờ
          </div>
          <p className="mt-2 text-2xl font-bold">{overtimeCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Đối chiếu với đơn OT trước khi chốt công.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table className="text-sm">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Nhân viên
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Ngày
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Vấn đề
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Chi tiết
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attentionRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                  Không có bản ghi bất thường trong khoảng lọc.
                </TableCell>
              </TableRow>
            ) : (
              attentionRecords.slice(0, 5).map((record) => (
                <TableRow key={`attention-${record.id}`} className="hover:bg-muted/30">
                  <TableCell className="px-4 py-3">
                    <p className="font-medium">{record.employee?.fullName ?? record.employeeId}</p>
                    {record.employee?.email ? (
                      <p className="text-xs text-muted-foreground">{record.employee.email}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(record.date)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusPill
                      label={
                        !record.checkOutAt && record.checkInAt
                          ? "Chưa checkout"
                          : getAttendanceStatusLabel(record.status)
                      }
                      variant={
                        !record.checkOutAt && record.checkInAt
                          ? "warning"
                          : getAttendanceStatusVariant(record.status)
                      }
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {record.lateMinutes > 0 ? `${record.lateMinutes}m muộn. ` : ""}
                    {record.earlyLeaveMinutes > 0 ? `${record.earlyLeaveMinutes}m về sớm. ` : ""}
                    {record.overtimeMinutes > 0 ? `${record.overtimeMinutes}m OT. ` : ""}
                    {record.checkInAt && !record.checkOutAt ? "Chưa có giờ ra." : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageCard>
  )
}
