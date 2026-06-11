import { AppDrawer, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  type IEmployeeRole,
  ROLE,
  ROLE_LABELS,
} from "@/config/entities/employee.config"
import { useEmployee } from "@/hooks/employees/queries/useEmployeeQuery"
import { useAuthStore } from "@/store/auth-store"

import { useMemo } from "react"

import { Briefcase, Building, Calendar, Edit, Hash, Mail, MapPin, Phone, User } from "lucide-react"

/**
 * Prop definitions for EmployeeDetailsDrawer component.
 */
interface EmployeeDetailsDrawerProps {
  /** The unique ID of the employee to load, or null to close the drawer */
  employeeId: string | null
  /** Callback triggered to close the details drawer */
  onClose: () => void
  /** Optional callback to open the edit dialog/drawer for this employee */
  onEdit?: (employee: any) => void
}

/**
 * Variant styles mapping for StatusPill badge component.
 */
const STATUS_VARIANT_MAP = {
  [EMPLOYEE_STATUS.ACTIVE]: "success",
  [EMPLOYEE_STATUS.INACTIVE]: "neutral",
  [EMPLOYEE_STATUS.ON_LEAVE]: "warning",
  [EMPLOYEE_STATUS.TERMINATED]: "danger",
} as const

/**
 * EmployeeDetailsDrawer Component.
 * Slide-out drawer displaying exhaustive details for a specific employee profile.
 * Renders loading states (skeleton), errors, basic information, and organizational metrics in a bento-style grid.
 */
export function EmployeeDetailsDrawer({ employeeId, onClose, onEdit }: EmployeeDetailsDrawerProps) {
  // Query hook to fetch employee details by their ID (reacts to changes in employeeId)
  const { data: employee, isLoading, error } = useEmployee(employeeId || "")
  const user = useAuthStore((state) => state.user)

  // Memoized checks if current user has permission to edit records
  const isAdminOrManager = useMemo(
    () =>
      ([ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER] as IEmployeeRole[]).includes(
        user?.role as IEmployeeRole,
      ),
    [user?.role],
  )

  /**
   * Formats a date string into Vietnamese localized format (DD/MM/YYYY).
   * @param dateStr ISO date string.
   * @returns Localized date string or placeholder text.
   */
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa cập nhật"
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <AppDrawer isOpen={!!employeeId} onClose={onClose}>
      {/* ── Loading Skeleton State ───────────────────────────────── */}
      {isLoading && (
        <div className="p-8 space-y-8 animate-in fade-in duration-300 mt-6">
          <div className="flex gap-4 items-center">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full col-span-2 rounded-xl" />
          </div>
        </div>
      )}

      {/* ── Error / Missing Record State ─────────────────────────── */}
      {!isLoading && (error || (!employee && employeeId)) && (
        <div className="p-8 flex flex-col items-center justify-center text-center h-full">
          <h2 className="text-lg font-medium text-destructive mb-1">Không thể tải hồ sơ</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Đã có lỗi xảy ra hoặc nhân sự không tồn tại.
          </p>
          <Button onClick={onClose} variant="outline" size="sm">
            Đóng
          </Button>
        </div>
      )}

      {/* ── Main Details Viewport ────────────────────────────────── */}
      {!isLoading && employee && (
        <div className="animate-in fade-in duration-300">
          {/* Header Section: Profile Cover, Avatar, Name & Quick Actions */}
          <div className="px-10 pt-14 pb-8 bg-muted/20 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                {employee.avatar?.url ? (
                  <img
                    src={employee.avatar.url}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {employee.fullName}
                  </h2>
                  {isAdminOrManager && employee.status !== EMPLOYEE_STATUS.TERMINATED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose()
                        onEdit?.(employee)
                      }}
                      className="h-8 gap-1.5 px-3"
                    >
                      <Edit size={13} /> Sửa
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                  <span className="font-mono bg-background border border-border px-1.5 py-0.5 rounded text-[11px]">
                    {employee.id.slice(-6).toUpperCase()}
                  </span>
                  <span>@{employee.username}</span>
                </div>
                <div className="pt-2">
                  <StatusPill
                    label={EMPLOYEE_STATUS_LABELS[employee.status] || employee.status}
                    variant={STATUS_VARIANT_MAP[employee.status] ?? "neutral"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Core Info Details Body */}
          <div className="p-10 space-y-8">
            {/* Bento Grid: Organization metrics (Title, Role, Contract) */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Tổ chức & Vị trí
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <Briefcase size={14} />
                    <span className="text-[12px] font-medium">Chức danh</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6">
                    {employee.position || "—"}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <User size={14} />
                    <span className="text-[12px] font-medium">Phân quyền hệ thống</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6 capitalize">
                    {ROLE_LABELS[employee.role] || employee.role}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card sm:col-span-2">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <Building size={14} />
                    <span className="text-[12px] font-medium">Loại hợp đồng</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6">
                    {EMPLOYEE_TYPE_LABELS[employee.employeeType] || employee.employeeType}
                  </div>
                </div>
              </div>
            </section>

            {/* List Group: Contact details (Email, Phone, Address) */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Liên hệ
              </h3>
              <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Email</span>
                  </div>
                  <span className="text-[14px] font-medium">{employee.email}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Điện thoại</span>
                  </div>
                  <span className="text-[14px] font-medium">{employee.phone || "—"}</span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Địa chỉ thường trú</span>
                  </div>
                  <span className="text-[14px] font-medium pl-7 leading-snug">
                    {employee.address || "—"}
                  </span>
                </div>
              </div>
            </section>

            {/* Bento Grid: Personal Dates & Identity numbers */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Hồ sơ cá nhân
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày sinh</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.dateOfBirth)}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Hash size={14} />
                    <span className="text-[12px] font-medium">CCCD / CMND</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium font-mono">
                    {employee.nationalId || "—"}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày vào làm</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.startDate)}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày kết thúc HĐ</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.endDate)}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </AppDrawer>
  )
}
