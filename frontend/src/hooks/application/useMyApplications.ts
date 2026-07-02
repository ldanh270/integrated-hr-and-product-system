import {
  APPLICATION_STATUS,
  type IApplicationFilterStatus,
} from "@/config/entities/attendance.config"
import {
  type IApplicationBatch,
  type IListBatchesQuery,
  applicationBatchApi,
} from "@/lib/api/application-batch.api"
import { type IListApplicationsQuery } from "@/lib/api/application.api"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

interface UseMyApplicationsReturn {
  applications: IApplicationBatch[]
  isLoading: boolean
  isRefreshing: boolean
  statusFilter: IApplicationFilterStatus
  setStatusFilter: (v: IApplicationFilterStatus) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  keyword: string
  setKeyword: (v: string) => void
  page: number
  setPage: (v: number) => void
  pageSize: number
  setPageSize: (v: number) => void
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
  const [applications, setApplications] = useState<IApplicationBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<IApplicationFilterStatus>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [keyword, setKeyword] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  })
  const activeRef = useRef(true)

  const fetchApplications = useCallback(
    async (isInitial = false) => {
      if (!isInitial) {
        setIsRefreshing(true)
      }

      try {
        // Backend query schema uses "pageSize" (not "limit") with .strict()
        const query: IListBatchesQuery = {
          page,
          pageSize,
        }

        if (statusFilter !== "all") query.status = statusFilter
        if (typeFilter !== "all") query.type = typeFilter
        if (keyword.trim() !== "") query.keyword = keyword.trim()

        const { data, meta } = await applicationBatchApi.listMine(query)

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
    [statusFilter, typeFilter, keyword, page, pageSize],
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
        statuses.map((s) => {
          const query: IListApplicationsQuery = { status: s, page: 1, pageSize: 1 }
          if (typeFilter !== "all") query.type = typeFilter
          if (keyword.trim() !== "") query.keyword = keyword.trim()
          return applicationBatchApi
            .listMine(query)
            .then((r) => r.meta?.total ?? 0)
            .catch(() => 0)
        }),
      )

      if (!activeRef.current) return

      setStats({
        pending: counts[0],
        approved: counts[1],
        rejected: counts[2],
        cancelled: counts[3],
        total: counts.reduce((a: number, b: number) => a + b, 0),
      })
    } catch (error) {
      console.error("Failed to fetch application stats", error)
    }
  }, [typeFilter, keyword])

  useEffect(() => {
    activeRef.current = true
    const timer = setTimeout(() => {
      if (activeRef.current) {
        fetchApplications(true)
        fetchStats()
      }
    }, 0)
    return () => {
      activeRef.current = false
      clearTimeout(timer)
    }
  }, [fetchApplications, fetchStats])

  const refetch = useCallback(() => {
    fetchApplications(false)
    fetchStats()
  }, [fetchApplications, fetchStats])

  const handleCancel = useCallback(
    async (id: string) => {
      setCancellingId(id)
      try {
        await applicationBatchApi.cancel(id)
        toast.success("Đã hủy đơn thành công")
        await fetchApplications()
      } catch (error) {
        const err = error as { response?: { data?: { error?: { message?: string } } } }
        toast.error(err.response?.data?.error?.message ?? "Lỗi khi hủy đơn")
      } finally {
        setCancellingId(null)
      }
    },
    [fetchApplications],
  )

  return {
    applications,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize: (v) => {
      setPageSize(v)
      setPage(1)
    },
    totalPages,
    total,
    refetch,
    stats,
    cancellingId,
    handleCancel,
  }
}
