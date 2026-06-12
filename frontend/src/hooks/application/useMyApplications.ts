import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import { type IApplication, type IListApplicationsQuery, applicationApi } from "@/lib/api/application.api"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

export type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled"

interface UseMyApplicationsReturn {
  applications: IApplication[]
  isLoading: boolean
  isRefreshing: boolean
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  page: number
  setPage: (v: number) => void
  totalPages: number
  total: number
  refetch: () => void
  stats: {
    pending: number
    approved: number
    rejected: number
    cancelled: number
    total: number
  }
  cancellingId: string | null
  handleCancel: (id: string) => Promise<void>
}

export function useMyApplications(): UseMyApplicationsReturn {
  const [applications, setApplications] = useState<IApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0, total: 0 })
  const activeRef = useRef(true)

  const fetchApplications = useCallback(
    async (isInitial = false) => {
      if (isInitial) setIsLoading(true)
      else setIsRefreshing(true)

      try {
        // Backend query schema uses "pageSize" (not "limit") with .strict()
        const query: IListApplicationsQuery = {
          page,
          pageSize: 10,
        }

        if (statusFilter !== "all") query.status = statusFilter
        if (typeFilter !== "all") query.type = typeFilter

        const { data, meta } = await applicationApi.listMine(query)

        if (!activeRef.current) return

        setApplications(data)
        if (meta) {
          // Backend returns "totalPages" in meta
          setTotalPages(meta.totalPages ?? 1)
          setTotal(meta.total ?? data.length)
        }
      } catch (error) {
        const err = error as { response?: { data?: { error?: { message?: string } } } }
        toast.error(err.response?.data?.error?.message ?? "Lỗi khi tải danh sách đơn")
      } finally {
        if (activeRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [statusFilter, typeFilter, page],
  )

  const fetchStats = useCallback(async () => {
    try {
      const statuses = [
        APPLICATION_STATUS.PENDING,
        APPLICATION_STATUS.APPROVED,
        APPLICATION_STATUS.REJECTED,
        APPLICATION_STATUS.CANCELLED,
      ] as const

      const counts = await Promise.all(
        statuses.map((s) =>
          applicationApi
            .listMine({ status: s, page: 1, pageSize: 1 })
            .then((r) => r.meta?.total ?? 0)
            .catch(() => 0),
        ),
      )

      if (!activeRef.current) return

      setStats({
        pending: counts[0],
        approved: counts[1],
        rejected: counts[2],
        cancelled: counts[3],
        total: counts.reduce((acc, c) => acc + c, 0),
      })
    } catch {
      // stats are non-critical — silently ignore
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    fetchApplications(true)
    fetchStats()
    return () => {
      activeRef.current = false
    }
  }, [fetchApplications, fetchStats])

  const refetch = useCallback(() => {
    fetchApplications(false)
    fetchStats()
  }, [fetchApplications, fetchStats])

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await applicationApi.cancel(id)
      toast.success("Đã hủy đơn thành công")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi hủy đơn")
    } finally {
      setCancellingId(null)
    }
  }

  return {
    applications,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    totalPages,
    total,
    refetch,
    stats,
    cancellingId,
    handleCancel,
  }
}
