import { PageCard, StatusPill } from "@/components/common"
import { EmployeeCreateModal } from "@/components/features/employees/EmployeeCreateModal"
import { EmployeeEditModal } from "@/components/features/employees/EmployeeEditModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EMPLOYEE_STATUS, EMPLOYEE_TYPES, ROLE } from "@/config/entities/employee.config"
import { useEmployees, useUpdateEmployeeStatus } from "@/hooks/useEmployees"
import { useAuthStore } from "@/store/auth-store"
import type { Employee, EmployeeListQuery, EmployeeType } from "@/types/employee.types"

import { useState } from "react"

import {
  Edit,
  Eye,
  FileDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function EmployeeList() {
  const user = useAuthStore((state) => state.user)
  const isAdminOrManager =
    user?.role === ROLE.ADMIN ||
    user?.role === ROLE.HR_MANAGER ||
    user?.role === ROLE.GENERAL_MANAGER
  const navigate = useNavigate()

  const [query, setQuery] = useState<EmployeeListQuery>({
    page: 1,
    limit: 50,
  })

  const [activeTab, setActiveTab] = useState<"all" | EmployeeType>("all")

  const { data, isLoading } = useEmployees(query)
  const updateStatusMutation = useUpdateEmployeeStatus()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null)

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
      await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.TERMINATED } })
      setActiveActionMenu(null)
    }
  }

  const tabs = [
    { id: "all", label: "Tất cả", count: data?.meta.total || 0 },
    { id: EMPLOYEE_TYPES[0], label: "Chính thức", count: "-" },
    { id: EMPLOYEE_TYPES[1], label: "Bán thời gian", count: "-" },
    { id: EMPLOYEE_TYPES[3], label: "Thực tập", count: "-" },
    { id: EMPLOYEE_TYPES[2], label: "Hợp đồng", count: "-" },
  ]

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case EMPLOYEE_STATUS.ACTIVE:
        return <StatusPill label="Đang làm" variant="success" />
      case EMPLOYEE_STATUS.INACTIVE:
        return <StatusPill label="Tạm nghỉ" variant="neutral" />
      case EMPLOYEE_STATUS.ON_LEAVE:
        return <StatusPill label="Nghỉ phép" variant="warning" />
      case EMPLOYEE_STATUS.TERMINATED:
        return <StatusPill label="Đã nghỉ" variant="danger" />
      default:
        return <StatusPill label={status} variant="neutral" />
    }
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case EMPLOYEE_TYPES[0]:
        return "Chính thức"
      case EMPLOYEE_TYPES[1]:
        return "Bán thời gian"
      case EMPLOYEE_TYPES[2]:
        return "Hợp đồng"
      case EMPLOYEE_TYPES[3]:
        return "Thực tập"
      default:
        return type
    }
  }

  return (
    <div className="container max-w-350 px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách nhân sự</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hồ sơ và danh sách toàn bộ nhân sự công ty.
          </p>
        </div>
        {isAdminOrManager && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus size={16} /> Thêm nhân sự
          </Button>
        )}
      </div>

      <PageCard className="overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-border overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as "all" | EmployeeType)}
              className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 flex items-center justify-between gap-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm họ tên, email..."
                className="pl-9 h-9 bg-background"
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter size={14} /> Lọc nâng cao
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <FileDown size={14} /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Nhân sự</th>
                <th className="px-6 py-4 font-medium">Mã NV</th>
                <th className="px-6 py-4 font-medium">Liên hệ</th>
                <th className="px-6 py-4 font-medium">Vị trí</th>
                <th className="px-6 py-4 font-medium">Hợp đồng</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Không tìm thấy nhân sự nào.
                  </td>
                </tr>
              ) : (
                data?.data.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20 shrink-0">
                          {employee.avatar?.url ? (
                            <img
                              src={employee.avatar.url}
                              alt={employee.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{employee.fullName}</div>
                          <div className="text-xs text-muted-foreground">{employee.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      {employee.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-foreground">{employee.phone || "-"}</div>
                      <div className="text-xs text-muted-foreground">{employee.email}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-foreground">{employee.position || "-"}</div>
                      <div className="text-xs text-muted-foreground uppercase">{employee.role}</div>
                    </td>
                    <td className="px-6 py-3">{getTypeDisplay(employee.employeeType)}</td>
                    <td className="px-6 py-3">{getStatusDisplay(employee.status)}</td>
                    <td className="px-6 py-3 text-right relative">
                      <button
                        onClick={() =>
                          setActiveActionMenu(activeActionMenu === employee.id ? null : employee.id)
                        }
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeActionMenu === employee.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveActionMenu(null)}
                          />
                          <div className="absolute right-6 top-10 w-40 bg-background rounded-lg shadow-lg border border-border py-1 z-20 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => navigate(`/employees/${employee.id}`)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Eye size={14} className="text-muted-foreground" /> Xem hồ sơ
                            </button>
                            {isAdminOrManager && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditEmployee(employee)
                                    setActiveActionMenu(null)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  <Edit size={14} className="text-blue-500" /> Sửa thông tin
                                </button>
                                {employee.status !== EMPLOYEE_STATUS.TERMINATED && (
                                  <button
                                    onClick={() => handleDelete(employee.id)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50/50 text-red-600 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Nghỉ việc
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Hiển thị{" "}
            <span className="font-medium text-foreground">
              {(query.page! - 1) * query.limit! + (data?.data.length ? 1 : 0)}
            </span>{" "}
            đến{" "}
            <span className="font-medium text-foreground">
              {(query.page! - 1) * query.limit! + (data?.data.length || 0)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium text-foreground">{data?.meta.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={query.page === 1}
              onClick={() =>
                setQuery((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
              }
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data?.meta.totalPages || 0) }).map((_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setQuery((prev) => ({ ...prev, page: p }))}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${query.page === p ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || query.page === data.meta.totalPages || data.meta.totalPages === 0}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      </PageCard>

      <EmployeeCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EmployeeEditModal
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        employee={editEmployee}
      />
    </div>
  )
}
