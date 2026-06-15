import { PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import VirtualScanner from "@/components/features/attendance/VirtualScanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
} from "@/config/entities/attendance.config"
import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { attendanceApi } from "@/lib/api/attendance.api"
import { formatDate, formatTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import dayjs from "dayjs"
import type { IAttendanceStatus } from "@/config/entities/attendance.config"

import { useMemo, useState } from "react"

import {
  CalendarX2,
  Clock,
  Download,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react"
import { Navigate } from "react-router-dom"

/**
 * getMonthRange — Returns an ISO date range for the current month.
 * @returns { startDate: string, endDate: string } format YYYY-MM-DD
 */
function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { startDate: start, endDate: end }
}

/**
 * AttendanceDashboard — Main management page for HR attendance oversight.
 * Displays aggregate stats, real-time scanner, and detailed history table.
 */
export default function AttendanceDashboard() {
  const user = useAuthStore((state) => state.user)

  if (user && user.role !== ROLE.ADMIN) {
    return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
  }

  return <AdminAttendanceDashboard />
}

function AdminAttendanceDashboard() {
  // startDate, endDate: Filter range for attendance records (default: current month)
  const [startDate, setStartDate] = useState(getMonthRange().startDate)
  const [endDate, setEndDate] = useState(getMonthRange().endDate)
  // statusFilter: Current selection for attendance status (all, late, on_time, etc.)
  const [statusFilter, setStatusFilter] = useState<IAttendanceStatus | "all">("all")

  /**
   * query — Memoized object for API request parameters.
   * Triggers re-fetch when startDate, endDate, or statusFilter changes.
   */
  const query = useMemo(
    () => ({
      startDate,
      endDate,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [startDate, endDate, statusFilter],
  )

  /**
   * useAttendanceRecords — Custom hook to fetch attendance data from Backend.
   * Calls API: attendanceApi.getRecords
   * Returns: { data, isLoading, isError }
   */
  const { data: records, isLoading, isError } = useAttendanceRecords(query)

  // today: Current moment using dayjs for timezone-safe comparison
  const today = dayjs()
  // todayRecords: Filter records that match today's date
  const todayRecords = records?.filter((r) => dayjs(r.date).isSame(today, "day")) ?? []
  // Statistics derived from today's filtered records
  const presentToday = todayRecords.filter((r) => r.checkInAt).length
  const lateToday = todayRecords.filter((r) => r.status === "late").length
  const absentToday = todayRecords.filter((r) => r.status === "absent").length

  /**
   * handleExport — Securely downloads the attendance report as a CSV file.
   * 1. Generates export URL via attendanceApi.exportCsv.
   * 2. Fetches URL with Authorization header (Bearer JWT).
   * 3. Converts response to Blob and triggers browser download.
   */
  const handleExport = async () => {
    const url = attendanceApi.exportCsv({
      startDate,
      endDate,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    })

    try {
      const token = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", `attendance_export_${startDate}_to_${endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Tổng quan chấm công"
        description="Dữ liệu chấm công toàn bộ nhân sự và cá nhân bạn."
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download size={16} /> Xuất CSV
          </Button>
        }
      />

      {/* Aggregate Stats Cards — Visualizing today's attendance health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PageCard padding="lg">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium tracking-tight">Tổng nhân sự</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{todayRecords.length || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Hôm nay có dữ liệu</p>
        </PageCard>

        <PageCard padding="lg">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium tracking-tight">Đã có mặt</p>
            <UserCheck className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{presentToday}</p>
          <p className="text-xs text-muted-foreground mt-1">Đã check in hôm nay</p>
        </PageCard>

        <PageCard padding="lg">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium tracking-tight">Đi muộn</p>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning">{lateToday}</p>
          <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
        </PageCard>

        <PageCard padding="lg">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium tracking-tight">Vắng mặt</p>
            <CalendarX2 className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-destructive">{absentToday}</p>
          <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
        </PageCard>
      </div>

      {/* Main dashboard content — Scanner sidebar + Detail history table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <VirtualScanner />
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Filtering Toolbar — Allowing user to scope history by date and status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40 h-9 text-sm"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40 h-9 text-sm"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as IAttendanceStatus | "all")}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ATTENDANCE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attendance History Table */}
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
                    // Skeleton-like loading state
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    // Error state feedback
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-destructive">
                        Lỗi khi tải dữ liệu chấm công.
                      </TableCell>
                    </TableRow>
                  ) : !records || records.length === 0 ? (
                    // Empty state feedback
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Không có bản ghi nào trong khoảng thời gian đã chọn.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data rendering
                    records.map((record) => {
                      const workHours = Math.floor(record.totalWorkMinutes / 60)
                      const workMins = record.totalWorkMinutes % 60
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell className="px-4 py-4">
                            <p className="font-medium whitespace-nowrap">
                              {record.employee?.fullName ?? record.employeeId}
                            </p>
                            {record.employee?.email && (
                              <p className="text-xs text-muted-foreground">{record.employee.email}</p>
                            )}
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
                              label={ATTENDANCE_STATUS_LABELS[record.status] ?? record.status}
                              variant={ATTENDANCE_STATUS_VARIANTS[record.status] ?? "neutral"}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-4 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                            {record.lateMinutes > 0 && (
                              <span className="text-warning">+{record.lateMinutes}m muộn </span>
                            )}
                            {record.earlyLeaveMinutes > 0 && (
                              <span className="text-warning">-{record.earlyLeaveMinutes}m sớm </span>
                            )}
                            {record.overtimeMinutes > 0 && (
                              <span className="text-info-foreground">+{record.overtimeMinutes}m OT</span>
                            )}
                            {!record.lateMinutes && !record.earlyLeaveMinutes && !record.overtimeMinutes && "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  )
}
