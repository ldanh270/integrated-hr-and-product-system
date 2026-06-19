import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import {
  type IApplication,
  type IListApplicationsQuery,
  applicationApi,
} from "@/lib/api/application.api"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

export type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled"

interface UseManageApplicationsReturn {
  applications: IApplication[]
  isLoading: boolean
  isRefreshing: boolean
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  keyword: string
  setKeyword: (v: string) => void
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
  processingId: string | null
  handleApprove: (id: string) => Promise<void>
  handleReject: (id: string, reason: string) => Promise<void>
}

export function useManageApplications(): UseManageApplicationsReturn {
  const [applications, setApplications] = useState<IApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending") // Default to pending for managers
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [keyword, setKeyword] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [processingId, setProcessingId] = useState<string | null>(null)
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
        const query: IListApplicationsQuery = {
          page,
          pageSize: 10,
        }

        if (statusFilter !== "all") query.status = statusFilter
        if (typeFilter !== "all") query.type = typeFilter
        if (keyword.trim() !== "") query.keyword = keyword.trim()

        const { data, meta } = await applicationApi.listAll(query)

        if (!activeRef.current) return

        setApplications(data)
        if (meta) {
          setTotalPages(meta.totalPages ?? 1)
          setTotal(meta.total ?? data.length)
        }
      } catch (error) {
        const err = error as { response?: { data?: { error?: { message?: string } } } }
        toast.error(err.response?.data?.error?.message ?? "Lỗi khi tải danh sách đơn cần duyệt")
      } finally {
        if (activeRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [statusFilter, typeFilter, keyword, page],
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
          return applicationApi
            .listAll(query)
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
        total: counts.reduce((a, b) => a + b, 0),
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

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await applicationApi.approve(id)
      toast.success("Đã phê duyệt đơn thành công")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi phê duyệt đơn")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    setProcessingId(id)
    try {
      await applicationApi.reject(id, reason)
      toast.success("Đã từ chối đơn thành công")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi từ chối đơn")
    } finally {
      setProcessingId(null)
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
    keyword,
    setKeyword,
    page,
    setPage,
    totalPages,
    total,
    refetch,
    stats,
    processingId,
    handleApprove,
    handleReject,
  }
}
