import { AppDrawer, PageCard, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ROLE, ROLE_LABELS } from "@/config/entities/employee.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { employeeApi } from "@/lib/api/employee.api"
import type { EmployeeRole } from "@/types/employee.types"

import { useQueries } from "@tanstack/react-query"
import { useState } from "react"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  User,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FolderLock
} from "lucide-react"

// Status colors mapping
const STATUS_VARIANT_MAP = {
  active: "success",
  inactive: "neutral",
  on_leave: "warning",
  terminated: "danger",
} as const

interface RoleCardConfig {
  code: string
  label: string
  desc: string
  icon: typeof Shield
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    code: ROLE.ADMIN,
    label: ROLE_LABELS[ROLE.ADMIN],
    desc: "Toàn quyền quản trị hệ thống, cấu hình tham số, quản lý người dùng và phê duyệt bảo mật.",
    icon: ShieldAlert,
  },
  {
    code: ROLE.GENERAL_MANAGER,
    label: ROLE_LABELS[ROLE.GENERAL_MANAGER],
    desc: "Xem báo cáo tổng thể, giám sát hoạt động nhân sự và kinh doanh của toàn công ty.",
    icon: ShieldCheck,
  },
  {
    code: ROLE.HR_MANAGER,
    label: ROLE_LABELS[ROLE.HR_MANAGER],
    desc: "Quản lý hồ sơ nhân sự, phân ca làm việc, chấm công, quản lý cấu hình và phát hành bảng lương.",
    icon: Shield,
  },
  {
    code: ROLE.TEAM_LEADER,
    label: ROLE_LABELS[ROLE.TEAM_LEADER],
    desc: "Quản lý trực tiếp các thành viên trong nhóm, phê duyệt các đơn từ xin nghỉ phép, đổi ca.",
    icon: Users,
  },
  {
    code: ROLE.EMPLOYEE,
    label: ROLE_LABELS[ROLE.EMPLOYEE],
    desc: "Nhân viên công ty, thực hiện chấm công, gửi đơn xin phép trực tuyến và theo dõi phiếu lương.",
    icon: User,
  },
]

export default function RolesManagement() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [drawerPage, setDrawerPage] = useState(1)

  // 1. Parallel queries using useQueries to get user count per role
  const roleQueries = useQueries({
    queries: ROLE_CARDS.map((r) => ({
      queryKey: ["employees", "list", { role: r.code, limit: 1, page: 1 }],
      queryFn: () => employeeApi.list({ role: r.code as EmployeeRole, limit: 1, page: 1 }),
    })),
  })

  // 2. Fetch users of the selected role inside the drawer
  const {
    data: roleUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useEmployees({
    role: (selectedRole || undefined) as EmployeeRole | undefined,
    page: drawerPage,
    limit: 8,
  })

  const activeRoleCard = ROLE_CARDS.find((r) => r.code === selectedRole)
  const selectedRoleLabel = activeRoleCard ? activeRoleCard.label : ""

  const handleOpenRoleDetail = (roleCode: string) => {
    setSelectedRole(roleCode)
    setDrawerPage(1)
  }

  const handleCloseDrawer = () => {
    setSelectedRole(null)
  }

  // Derive pagination for drawer
  const totalUsers = roleUsers?.meta.total ?? 0
  const totalPages = roleUsers?.meta.totalPages ?? 0

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Quản lý Vai trò & Phân quyền
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xem danh sách các vai trò hệ thống và số lượng nhân sự được cấp quyền.
          </p>
        </div>
      </div>

      {/* Grid layout for Roles summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLE_CARDS.map((roleCard, index) => {
          const queryResult = roleQueries.at(index) || roleQueries[0]
          const count = queryResult.data?.meta.total ?? 0
          const isLoadingCount = queryResult.isLoading
          const isErrorCount = queryResult.isError

          const IconComponent = roleCard.icon

          return (
            <PageCard key={roleCard.code} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <IconComponent size={20} />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {roleCard.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{roleCard.label}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{roleCard.desc}</p>
                </div>

                <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nhân sự</span>
                    <span className="text-lg font-extrabold text-foreground">
                      {isLoadingCount ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                      ) : isErrorCount ? (
                        <span className="text-rose-500 text-xs">Lỗi</span>
                      ) : (
                        count
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/5"
                    onClick={() => { handleOpenRoleDetail(roleCard.code) }}
                  >
                    Xem chi tiết
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            </PageCard>
          )
        })}
      </div>

      {/* AppDrawer for Role Details */}
      <AppDrawer isOpen={!!selectedRole} onClose={handleCloseDrawer} widthClassName="w-full sm:max-w-[32rem]">
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-6 pt-6">
              <div className="flex items-center gap-2 mb-1">
                <FolderLock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Vai trò: {selectedRoleLabel}</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng cộng có <span className="font-semibold text-foreground">{totalUsers}</span> nhân sự thuộc vai trò này.
              </p>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoadingUsers ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-3">Đang tải danh sách nhân sự...</p>
                </div>
              ) : isErrorUsers ? (
                <div className="py-12 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-5">
                  <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">Không thể tải dữ liệu</h4>
                  <p className="text-xs text-muted-foreground mt-1">Đã có lỗi xảy ra khi truy xuất thông tin.</p>
                  <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={() => refetchUsers()}>
                    Thử lại
                  </Button>
                </div>
              ) : roleUsers?.data.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border rounded-xl p-6">
                  <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-foreground">Trống</h4>
                  <p className="text-xs text-muted-foreground mt-1">Không có nhân sự nào giữ vai trò này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roleUsers?.data.map((employee) => (
                    <div
                      key={employee.id}
                      className="p-3.5 border border-border/80 rounded-xl bg-muted/5 flex items-center justify-between hover:bg-muted/15 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 border border-border">
                          {employee.avatar?.url ? (
                            <img src={employee.avatar.url} alt={employee.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={15} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground leading-snug">{employee.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono leading-none">{employee.username}</span>
                        </div>
                      </div>

                      <StatusPill
                        label={
                          employee.status === "active"
                            ? "Đang làm việc"
                            : employee.status === "inactive"
                            ? "Tạm nghỉ"
                            : employee.status === "on_leave"
                            ? "Nghỉ phép"
                            : "Đã nghỉ"
                        }
                        variant={STATUS_VARIANT_MAP[employee.status] ?? "neutral"}
                        className="text-[10px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Trang <span className="text-foreground font-semibold">{drawerPage}</span> / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  disabled={drawerPage === 1}
                  onClick={() => { setDrawerPage((prev) => Math.max(1, prev - 1)) }}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  disabled={drawerPage === totalPages}
                  onClick={() => { setDrawerPage((prev) => Math.min(totalPages, prev + 1)) }}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppDrawer>
    </div>
  )
}
