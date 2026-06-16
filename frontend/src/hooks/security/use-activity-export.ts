import { EXPORT_STATUS, type IExportStatus } from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import { securityApi } from "@/lib/api/security.api"
import type { ActivityLogItem, ActivityLogQuery } from "@/types/security.types"
import { buildCSVChunk, buildCSVHeaders, downloadCSVFromChunks } from "@/utils/csv.util"

import { useRef, useState } from "react"

import { toast } from "sonner"

// Safety constants
const MAX_EXPORT_ROWS = 50000
const EXPORT_BATCH_SIZE = 500

interface ExportProgress {
  status: IExportStatus
  totalRows: number
  fetchedRows: number
  errorMsg: string | null
}

/**
 * Hook for handling the background export of activity logs to CSV.
 * Fetches data in batches and streams them into CSV chunks to prevent memory/DB overload.
 *
 * @param baseQuery The filter and sorting query to base the export on.
 * @returns State and methods to control the export progress.
 */
export function useActivityExport(baseQuery: ActivityLogQuery) {
  const [progress, setProgress] = useState<ExportProgress>({
    status: EXPORT_STATUS.IDLE,
    totalRows: 0,
    fetchedRows: 0,
    errorMsg: null,
  })

  // Keep track of abort controller so we can cancel mid-flight
  const abortControllerRef = useRef<AbortController | null>(null)

  const columns = [
    {
      header: "Thời gian",
      accessor: (log: ActivityLogItem) => new Date(log.createdAt).toLocaleString("vi-VN"),
    },
    {
      header: "Mã Nhân Viên",
      accessor: (log: ActivityLogItem) => log.employeeId || COMMON_TEXTS.NOT_AVAILABLE,
    },
    {
      header: "Họ Tên",
      accessor: (log: ActivityLogItem) => log.employeeName || COMMON_TEXTS.SYSTEM,
    },
    { header: "Danh mục", accessor: (log: ActivityLogItem) => log.category },
    { header: "Hành động", accessor: (log: ActivityLogItem) => log.actionType },
    {
      header: "Địa chỉ IP",
      accessor: (log: ActivityLogItem) => log.ipAddress || COMMON_TEXTS.NOT_AVAILABLE,
    },
    {
      header: "Chi tiết JSON",
      accessor: (log: ActivityLogItem) => {
        if (!log.details) return ""
        try {
          const parsed = typeof log.details === "string" ? JSON.parse(log.details) : log.details
          return JSON.stringify(parsed)
        } catch {
          return typeof log.details === "string" ? log.details : JSON.stringify(log.details)
        }
      },
    },
  ]

  const cancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setProgress({ status: EXPORT_STATUS.IDLE, totalRows: 0, fetchedRows: 0, errorMsg: null })
  }

  const startExport = async () => {
    if (!baseQuery.fromDate || !baseQuery.toDate) {
      toast.error("Vui lòng chọn khoảng thời gian (Từ ngày - Đến ngày) để xuất báo cáo.")
      return
    }

    setProgress({ status: EXPORT_STATUS.COUNTING, totalRows: 0, fetchedRows: 0, errorMsg: null })

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Pre-flight count check
      const countResponse = await securityApi.listLogs(
        { ...baseQuery, limit: 1, page: 1 },
        { signal: controller.signal },
      )

      const total = countResponse.meta.total

      if (total === 0) {
        toast.info("Không có dữ liệu nào khớp với bộ lọc hiện tại.")
        setProgress({ status: EXPORT_STATUS.IDLE, totalRows: 0, fetchedRows: 0, errorMsg: null })
        return
      }

      if (total > MAX_EXPORT_ROWS) {
        const errorMsg = `Dữ liệu quá lớn (${total.toLocaleString()} dòng). Giới hạn xuất tối đa là ${MAX_EXPORT_ROWS.toLocaleString()} dòng. Vui lòng thu hẹp khoảng thời gian hoặc thêm bộ lọc.`
        setProgress({ status: EXPORT_STATUS.ERROR, totalRows: total, fetchedRows: 0, errorMsg })
        return
      }

      // Setup batching
      setProgress({
        status: EXPORT_STATUS.FETCHING,
        totalRows: total,
        fetchedRows: 0,
        errorMsg: null,
      })
      const chunks: string[] = []
      chunks.push(buildCSVHeaders(columns))

      let currentPage = 1
      let hasMore = true
      let fetched = 0

      // Fetch sequentially to avoid DB lock
      while (hasMore) {
        // Exit loop if cancelled
        if (controller.signal.aborted) throw new Error("Cancelled")

        const batchResponse = await securityApi.listLogs(
          { ...baseQuery, limit: EXPORT_BATCH_SIZE, page: currentPage },
          { signal: controller.signal },
        )

        const logs = batchResponse.data
        if (logs.length === 0) break // Safety exit

        chunks.push(buildCSVChunk(logs, columns))
        fetched += logs.length

        setProgress((prev) => ({ ...prev, fetchedRows: fetched }))

        if (fetched >= total || currentPage >= batchResponse.meta.totalPages) {
          hasMore = false
        } else {
          currentPage++
        }
      }

      // Build and download Blob
      setProgress((prev) => ({ ...prev, status: EXPORT_STATUS.BUILDING }))

      // Allow UI to render the 'building' state before freezing main thread for Blob creation
      await new Promise((resolve) => setTimeout(resolve, 50))

      const filename = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`
      downloadCSVFromChunks(chunks, filename)

      setProgress({
        status: EXPORT_STATUS.SUCCESS,
        totalRows: total,
        fetchedRows: total,
        errorMsg: null,
      })
      toast.success(`Đã xuất thành công ${total.toLocaleString()} dòng dữ liệu.`)

      // Auto reset after 3s
      setTimeout(() => {
        if (abortControllerRef.current === controller) {
          setProgress({ status: EXPORT_STATUS.IDLE, totalRows: 0, fetchedRows: 0, errorMsg: null })
        }
      }, 3000)
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string }
      if (err.message === "canceled" || err.code === "ERR_CANCELED" || controller.signal.aborted) {
        toast.info("Đã hủy xuất báo cáo.")
      } else {
        console.error("Export error:", error)
        toast.error("Có lỗi xảy ra khi xuất báo cáo.")
        setProgress((prev) => ({
          ...prev,
          status: EXPORT_STATUS.ERROR,
          errorMsg: "Có lỗi xảy ra trong quá trình tải dữ liệu.",
        }))
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }

  return {
    progress,
    startExport,
    cancelExport,
  }
}
