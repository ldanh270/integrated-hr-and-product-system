import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import { APPROVAL_CATEGORY } from "@/config/rules/approval.config"
import { type IApprovalItem, approvalApi } from "@/lib/api/approval.api"
import { useAuthStore } from "@/store/auth-store"

import { useEffect, useState } from "react"

import { toast } from "sonner"

export type CategoryFilter = "all" | "application" | "password_reset" | "recruitment_proposal"

export function useApplicationDashboard() {
  const [approvals, setApprovals] = useState<IApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all")

  // Modals state
  const [selectedApproval, setSelectedApproval] = useState<IApprovalItem | null>(null)
  const [rejectingItem, setRejectingItem] = useState<IApprovalItem | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [newTempPassword, setNewTempPassword] = useState("")
  const [approvedEmployeeName, setApprovedEmployeeName] = useState("")

  const { user } = useAuthStore()

  const fetchApprovals = async () => {
    try {
      setIsLoading(true)
      const data = await approvalApi.getPendingApprovals()
      setApprovals(data)
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message || "Lỗi khi tải danh sách đơn cần duyệt")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await approvalApi.getPendingApprovals()
        if (active) setApprovals(data)
      } catch (error) {
        const err = error as { response?: { data?: { error?: { message?: string } } } }
        toast.error(err.response?.data?.error?.message || "Lỗi khi tải danh sách đơn cần duyệt")
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const handleApprove = async (item: IApprovalItem) => {
    try {
      setIsProcessing(true)
      const result = await approvalApi.processApproval(
        item.category,
        item.id,
        APPLICATION_STATUS.APPROVED,
      )

      if (item.category === APPROVAL_CATEGORY.PASSWORD_RESET && result?.tempPassword) {
        setNewTempPassword(result.tempPassword)
        setApprovedEmployeeName(item.employeeName)
      } else {
        toast.success("Đã phê duyệt đơn thành công!")
      }

      setSelectedApproval(null)
      fetchApprovals()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message || "Lỗi khi phê duyệt đơn")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingItem) return
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      setIsProcessing(true)
      await approvalApi.processApproval(
        rejectingItem.category,
        rejectingItem.id,
        APPLICATION_STATUS.REJECTED,
        rejectReason,
      )
      toast.success("Đã từ chối đơn thành công!")
      setRejectingItem(null)
      setSelectedApproval(null)
      setRejectReason("")
      fetchApprovals()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message || "Lỗi khi từ chối đơn")
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter approvals based on category and search term
  const filteredApprovals = approvals.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory
    const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group stats
  const pendingCount = approvals.length
  const appCount = approvals.filter((a) => a.category === APPROVAL_CATEGORY.APPLICATION).length
  const pwCount = approvals.filter((a) => a.category === APPROVAL_CATEGORY.PASSWORD_RESET).length
  const recruitmentCount = approvals.filter(
    (a) => a.category === APPROVAL_CATEGORY.RECRUITMENT_PROPOSAL,
  ).length

  return {
    approvals,
    isLoading,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    selectedApproval,
    setSelectedApproval,
    rejectingItem,
    setRejectingItem,
    rejectReason,
    setRejectReason,
    isProcessing,
    newTempPassword,
    setNewTempPassword,
    approvedEmployeeName,
    setApprovedEmployeeName,
    user,
    handleApprove,
    handleRejectSubmit,
    filteredApprovals,
    pendingCount,
    appCount,
    pwCount,
    recruitmentCount,
  }
}
