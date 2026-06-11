import { PageCard, StatusPill } from "@/components/common"
import { EmployeeCreateModal } from "@/components/features/employees/EmployeeCreateModal"
import { EmployeeDetailsDrawer } from "@/components/features/employees/EmployeeDetailsDrawer"
import { EmployeeEditDrawer } from "@/components/features/employees/EmployeeEditDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE_LABELS,
} from "@/config/entities/employee.config"
import { useEmployeeMaster } from "@/hooks/employees/useEmployeeMaster"
import type { EmployeeType } from "@/types/employee.types"

import { useMemo } from "react"

import { Edit, FileDown, MoreHorizontal, Plus, RotateCcw, Search, Trash2, User } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Valid identifiers for active filter tabs on the dashboard page.
 */
type ActiveTab = "all" | EmployeeType | typeof EMPLOYEE_STATUS.TERMINATED

/**
 * Tab definition model representing dashboard filter criteria.
 */
interface TabDefinition {
  id: ActiveTab
  label: string
  separator?: boolean
}

// ─── Static constants (defined outside component — zero re-alloc) ─────────────

/**
 * List of tab filters to select from.
 */
const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "all", label: "Tất cả" },
  { id: EMPLOYEE_TYPES[0], label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES[0]] },
  { id: EMPLOYEE_TYPES[1], label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES[1]] },
  { id: EMPLOYEE_TYPES[3], label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES[3]] },
  { id: EMPLOYEE_TYPES[2], label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES[2]] },
  { id: EMPLOYEE_STATUS.TERMINATED, label: "Đã nghỉ việc", separator: true },
]

/**
 * Variant styles mapping for StatusPill badge component.
 */
const STATUS_VARIANT_MAP = {
  [EMPLOYEE_STATUS.ACTIVE]: "success",
  [EMPLOYEE_STATUS.INACTIVE]: "neutral",
  [EMPLOYEE_STATUS.ON_LEAVE]: "warning",
  [EMPLOYEE_STATUS.TERMINATED]: "danger",
} as const

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmployeeList Component.
 * Renders the employee master table, page header, search filters, tab switcher, pagination controls,
 * and handles interactions for viewing detail drawer, editing, creating, and terminating.
 */
export default function EmployeeList() {
  // Extract state & handlers from master hook (decouples UI from business state logic)
  const {
    query,
    setQuery,
    activeTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editEmployee,
    setEditEmployee,
    viewingEmployeeId,
    setViewingEmployeeId,
    activeActionMenu,
    setActiveActionMenu,
    data,
    isLoading,
    handleSearch,
    handleTabChange,
    handleDelete,
    handleReinstate,
    isAdminOrManager,
  } = useEmployeeMaster()

  // Derived pagination calculations
  const totalPages = data?.meta.totalPages ?? 0
  const pageStart = (query.page! - 1) * query.limit! + (data?.data.length ? 1 : 0)
  const pageEnd = (query.page! - 1) * query.limit! + (data?.data.length || 0)

  // Calculate which page numbers to display in pagination bar (capped at 5 pages)
  const visiblePages = useMemo(
    () => Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1),
    [totalPages],
  )

  return (
    <div className="container max-w-350 px-6 py-8">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Nhân sự
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý hồ sơ toàn bộ nhân sự công ty.
          </p>
        </div>
        {isAdminOrManager && (
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 h-8 px-3 text-xs"
          >
            <Plus size={13} strokeWidth={2.5} />
            Thêm nhân sự
          </Button>
        )}
      </div>

      <PageCard className="overflow-hidden" padding="sm" noBorder={false}>
        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <nav
          aria-label="Lọc nhân sự"
          className="flex items-end gap-0 px-5 border-b border-border overflow-x-auto hide-scrollbar"
        >
          {TAB_DEFINITIONS.map((tab) => (
            <div key={tab.id} className="flex items-end shrink-0">
              {tab.separator && <div className="w-px h-3.5 bg-border self-center mx-3 shrink-0" />}
              <button
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "relative py-3 px-3 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-t-sm",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.id === "all" && (
                    <span
                      className={[
                        "text-[10px] font-semibold px-1.5 py-px rounded-full leading-none tabular-nums",
                        activeTab === "all"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {data?.meta.total ?? 0}
                    </span>
                  )}
                </span>
                {/* Active underline */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-t-xs" />
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-border">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm kiếm họ tên, email..."
              className="pl-8 h-8 text-sm bg-muted/40 border-transparent focus:bg-background focus:border-border transition-colors"
              onChange={handleSearch}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
            <FileDown size={13} />
            Xuất Excel
          </Button>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Nhân sự
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Mã NV
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Liên hệ
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Vị trí
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Hợp đồng
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    Không tìm thấy nhân sự nào.
                  </td>
                </tr>
              ) : (
                data?.data.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors duration-100"
                  >
                    {/* Nhân sự */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 border border-border">
                          {employee.avatar?.url ? (
                            <img
                              src={employee.avatar.url}
                              alt={employee.fullName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User size={14} strokeWidth={1.5} />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setViewingEmployeeId(employee.id)}
                            className="text-[13px] font-medium text-foreground leading-tight hover:text-primary hover:underline focus-visible:outline-none focus-visible:text-primary text-left transition-colors"
                          >
                            {employee.fullName}
                          </button>
                          <div className="text-[11px] text-muted-foreground leading-tight">
                            {employee.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mã NV */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {employee.id.slice(-6).toUpperCase()}
                      </span>
                    </td>

                    {/* Liên hệ */}
                    <td className="px-5 py-3">
                      <div className="text-[13px] text-foreground">{employee.phone || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{employee.email}</div>
                    </td>

                    {/* Vị trí */}
                    <td className="px-5 py-3">
                      <div className="text-[13px] text-foreground">{employee.position || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{employee.role}</div>
                    </td>

                    {/* Hợp đồng */}
                    <td className="px-5 py-3 text-[13px] text-foreground">
                      {EMPLOYEE_TYPE_LABELS[employee.employeeType] || employee.employeeType}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-3">
                      <StatusPill
                        label={EMPLOYEE_STATUS_LABELS[employee.status] || employee.status}
                        variant={STATUS_VARIANT_MAP[employee.status] ?? "neutral"}
                      />
                    </td>

                    {/* Thao tác */}
                    <td className="px-5 py-3 text-right relative">
                      <button
                        onClick={() =>
                          setActiveActionMenu(activeActionMenu === employee.id ? null : employee.id)
                        }
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Mở menu thao tác"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {activeActionMenu === employee.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveActionMenu(null)}
                          />
                          {/* Dropdown */}
                          <div className="absolute right-5 top-10 w-44 bg-background border border-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-1 z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            {isAdminOrManager && (
                              <>
                                {employee.status !== EMPLOYEE_STATUS.TERMINATED && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditEmployee(employee)
                                        setActiveActionMenu(null)
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted flex items-center gap-2 text-foreground"
                                    >
                                      <Edit size={13} className="text-blue-500 shrink-0" />
                                      Sửa thông tin
                                    </button>
                                    <div className="mx-2 my-1 border-t border-border" />
                                    <button
                                      onClick={() => handleDelete(employee.id)}
                                      className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/30 flex items-center gap-2"
                                    >
                                      <Trash2 size={13} className="shrink-0" />
                                      Cho nghỉ việc
                                    </button>
                                  </>
                                )}

                                {employee.status === EMPLOYEE_STATUS.TERMINATED && (
                                  <>
                                    <div className="mx-2 my-1 border-t border-border" />
                                    <button
                                      onClick={() => handleReinstate(employee.id)}
                                      className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-emerald-50 text-emerald-700 dark:hover:bg-emerald-950/30 flex items-center gap-2"
                                    >
                                      <RotateCcw size={13} className="shrink-0" />
                                      Đi làm lại
                                    </button>
                                  </>
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

        {/* ── Pagination ───────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground">
            {pageStart}–{pageEnd}{" "}
            <span className="text-foreground font-medium">/ {data?.meta.total ?? 0}</span>
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={query.page === 1}
              onClick={() =>
                setQuery((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
              }
            >
              ←
            </Button>

            {visiblePages.map((p) => (
              <button
                key={p}
                onClick={() => setQuery((prev) => ({ ...prev, page: p }))}
                className={[
                  "w-7 h-7 rounded-md text-xs flex items-center justify-center transition-colors",
                  query.page === p
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {p}
              </button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!data || query.page === totalPages || totalPages === 0}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              →
            </Button>
          </div>
        </div>
      </PageCard>

      {/* Creation Modal */}
      <EmployeeCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Editing Drawer */}
      <EmployeeEditDrawer
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        employee={editEmployee}
      />

      {/* Detail Drawer */}
      <EmployeeDetailsDrawer
        employeeId={viewingEmployeeId}
        onClose={() => setViewingEmployeeId(null)}
        onEdit={(emp) => setEditEmployee(emp)}
      />
    </div>
  )
}
