import { useConfirm } from "@/components/common"
import { EMPLOYEE_STATUS } from "@/config/entities/employee.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { usePermission } from "@/hooks/use-permission"
import type {
  Employee,
  EmployeeListQuery,
  EmployeeStatus,
  EmployeeType,
} from "@/types/employee.types"

import { useState } from "react"

import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useEmployees, useUpdateEmployeeStatus } from "./queries/useEmployeeQuery"

/**
 * Custom React hook that encapsulates state and methods for the Employee Master view.
 * Handles filters, query state, action menus, modals, and mutation calls for employees.
 *
 * @returns Object containing all employee state values and handle handlers.
 */
export const useEmployeeMaster = () => {
  const confirm = useConfirm()

  // Query parameters for fetching the paginated employee list
  const [query, setQuery] = useState<EmployeeListQuery>({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT,
  })

  // The active filter tab (all, full-time, part-time, intern, contractor, terminated)
  const [activeTab, setActiveTab] = useState<
    "all" | EmployeeType | typeof EMPLOYEE_STATUS.TERMINATED
  >("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)
  // Auth context to check permission roles
  const { hasAnyPermission } = usePermission()
  const isAdminOrManager = hasAnyPermission([
    "employee.create",
    "employee.update",
    "employee.delete",
  ])
  const navigate = useNavigate()

  // Queries and mutations from React Query hooks
  const { data, isLoading, isFetching } = useEmployees(query)
  const updateStatusMutation = useUpdateEmployeeStatus()

  /**
   * Event handler for searching employees by text input.
   * Resets pagination page to 1.
   * @param e Change event from the text input.
   */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))
  }

  /**
   * Handler for switching tabs (filters) in the employee master dashboard.
   * Adjusts the query filters accordingly.
   * @param tab Selected tab identifier.
   */
  const handleTabChange = (tab: "all" | EmployeeType | typeof EMPLOYEE_STATUS.TERMINATED) => {
    setActiveTab(tab)
    if (tab === "all") {
      const newQuery = { ...query, page: 1 }
      delete newQuery.type
      delete newQuery.status
      setQuery(newQuery)
    } else if (tab === EMPLOYEE_STATUS.TERMINATED) {
      const newQuery = { ...query, page: 1, status: EMPLOYEE_STATUS.TERMINATED as EmployeeStatus }
      delete newQuery.type
      setQuery(newQuery)
    } else {
      const newQuery = { ...query, page: 1, type: tab }
      delete newQuery.status
      setQuery(newQuery)
    }
  }

  /**
   * Triggers a status change to terminated for a given employee.
   * Prompts the user with a confirmation dialog.
   * @param id The ID of the employee to terminate.
   */
  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Cho nhân sự nghỉ việc",
      description:
        "Bạn có chắc chắn muốn cho nhân sự này nghỉ việc? Trạng thái tài khoản sẽ được chuyển thành thôi việc.",
      confirmText: "Đồng ý",
      cancelText: "Hủy bỏ",
      variant: "destructive",
    })

    if (isConfirmed) {
      try {
        await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.TERMINATED } })
        toast.success("Đã cho nhân sự nghỉ việc thành công.")
      } catch {
        toast.error("Có lỗi xảy ra khi cập nhật trạng thái nhân sự.")
      }
    }
  }

  /**
   * Re-activates a terminated employee's contract back to ACTIVE status.
   * Prompts the user with a confirmation dialog.
   * @param id The ID of the employee.
   */
  const handleReinstate = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Kích hoạt lại nhân sự",
      description:
        "Bạn có chắc chắn muốn cho nhân sự này đi làm lại? Trạng thái tài khoản sẽ được chuyển thành đang làm việc.",
      confirmText: "Đồng ý",
      cancelText: "Hủy bỏ",
      variant: "default",
    })

    if (isConfirmed) {
      try {
        await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.ACTIVE } })
        toast.success("Đã kích hoạt lại nhân sự thành công.")
      } catch {
        toast.error("Có lỗi xảy ra khi kích hoạt lại nhân sự.")
      }
    }
  }

  return {
    // State
    query,
    setQuery,
    activeTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editEmployee,
    setEditEmployee,
    viewingEmployeeId,
    setViewingEmployeeId,
    // Data
    data,
    isLoading,
    isFetching,
    // Handlers
    handleSearch,
    handleTabChange,
    handleDelete,
    handleReinstate,
    // Auth & Nav
    isAdminOrManager,
    navigate,
  }
}
