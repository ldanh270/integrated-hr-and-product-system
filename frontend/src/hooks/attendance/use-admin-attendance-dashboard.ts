import type { IAttendanceStatus } from "@/config/entities/attendance.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { attendanceApi } from "@/lib/api/attendance.api"
import { getCurrentMonthRange } from "@/utils/attendance/get-current-month-range"

import { useMemo, useState } from "react"

import dayjs from "dayjs"

export function useAdminAttendanceDashboard() {
  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate)
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate)
  const [statusFilter, setStatusFilter] = useState<IAttendanceStatus | "all">("all")

  const query = useMemo(
    () => ({
      startDate,
      endDate,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [startDate, endDate, statusFilter],
  )

  const { data: records, isLoading, isError } = useAttendanceRecords(query)

  const today = dayjs()
  const todayRecords = records?.filter((record) => dayjs(record.date).isSame(today, "day")) ?? []
  const presentToday = todayRecords.filter((record) => record.checkInAt).length
  const lateToday = todayRecords.filter((record) => record.status === "late").length
  const absentToday = todayRecords.filter((record) => record.status === "absent").length
  const openCheckoutToday = todayRecords.filter((record) => record.checkInAt && !record.checkOutAt)
  const attentionRecords =
    records?.filter(
      (record) =>
        (record.checkInAt && !record.checkOutAt) ||
        record.status === "late" ||
        record.status === "early_leave" ||
        record.status === "overtime" ||
        record.earlyLeaveMinutes > 0 ||
        record.overtimeMinutes > 0,
    ) ?? []

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

  return {
    startDate,
    endDate,
    statusFilter,
    setStartDate,
    setEndDate,
    setStatusFilter,
    records,
    isLoading,
    isError,
    todayRecordsCount: todayRecords.length,
    presentToday,
    lateToday,
    absentToday,
    openCheckoutToday,
    attentionRecords,
    handleExport,
  }
}
