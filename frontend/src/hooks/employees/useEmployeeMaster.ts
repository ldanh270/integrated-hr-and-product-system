import { useState } from "react"
import { toast } from "sonner"
import { useEmployees, useUpdateEmployeeStatus } from "./queries/useEmployeeQuery"
import { EMPLOYEE_STATUS, ROLE } from "@/config/entities/employee.config"
import type { Employee, EmployeeListQuery, EmployeeType } from "@/types/employee.types"
import { useAuthStore } from "@/store/auth-store"
import { useNavigate } from "react-router-dom"

export const useEmployeeMaster = () => {
  const [query, setQuery] = useState<EmployeeListQuery>({
    page: 1,
    limit: 50,
  })

  const [activeTab, setActiveTab] = useState<"all" | EmployeeType>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null)

  const user = useAuthStore((state) => state.user)
  const isAdminOrManager =
    user?.role === ROLE.ADMIN ||
    user?.role === ROLE.HR_MANAGER ||
    user?.role === ROLE.GENERAL_MANAGER
  const navigate = useNavigate()

  const { data, isLoading } = useEmployees(query)
  const updateStatusMutation = useUpdateEmployeeStatus()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))
  }

  const handleTabChange = (tab: "all" | EmployeeType) => {
    setActiveTab(tab)
    if (tab === "all") {
      const newQuery = { ...query, page: 1 }
      delete newQuery.employeeType
      setQuery(newQuery)
    } else {
      setQuery((prev) => ({ ...prev, employeeType: tab, page: 1 }))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn cho nghỉ việc nhân sự này?")) {
      try {
        await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.TERMINATED } })
        toast.success("Đã cập nhật trạng thái nhân sự thành công.")
        setActiveActionMenu(null)
      } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật trạng thái nhân sự.")
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
    activeActionMenu,
    setActiveActionMenu,
    // Data
    data,
    isLoading,
    // Handlers
    handleSearch,
    handleTabChange,
    handleDelete,
    // Auth & Nav
    isAdminOrManager,
    navigate,
  }
}
