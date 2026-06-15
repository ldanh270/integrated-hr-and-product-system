import { PageCard, StatusPill } from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActivityLogsMaster } from "@/hooks/security/use-activity-logs-master"
import { cn } from "@/lib/utils"

import {
  AlertTriangle,
  Calendar,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

/**
 * ActivityLogs Component.
 * Renders a full audit trail of system activities with filtering and detail view.
 */
export default function ActivityLogs() {
  const {
    query,
    setQuery,
    searchTerm,
    handleSearch,
    handleFilterChange,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useActivityLogsMaster()

  // Derived pagination calculations
  const totalPages = data?.meta.totalPages ?? 0
  const pageStart = (query.page! - 1) * (query.limit || 20) + (data?.data.length ? 1 : 0)
  const pageEnd = (query.page! - 1) * (query.limit || 20) + (data?.data.length || 0)

  // Visible pages calculation (simple array)
  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, (query.page || 1) - 3),
    Math.min(totalPages, (query.page || 1) + 2),
  )

  const ACTION_VARIANT_MAP: Record<string, "success" | "danger" | "warning" | "neutral"> = {
    login: "success",
    logout: "neutral",
    failed_login: "danger",
    account_locked: "danger",
    account_unlocked: "success",
    role_assigned: "success",
    role_revoked: "warning",
    password_changed: "warning",
  }

  if (isLoading) {
    return (
      <div className="container px-6 py-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu nhật ký...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="container px-6 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải nhật ký hoạt động. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Nhật ký hoạt động
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Truy vết toàn bộ hoạt động bảo mật và thay đổi dữ liệu trong hệ thống.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 h-8 px-3 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      <PageCard className="overflow-hidden" padding="sm">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo ID nhân viên..."
                className="pl-8 h-9 text-sm bg-background border-border"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={query.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value || undefined)}
              >
                <option value="">Tất cả danh mục</option>
                <option value="auth">Xác thực</option>
                <option value="employee">Nhân sự</option>
                <option value="security">Bảo mật</option>
                <option value="payroll">Lương</option>
              </select>
            </div>

            {query.actionType && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded text-xs font-semibold border border-primary/20">
                Hành động: {query.actionType}
                <button
                  onClick={() => handleFilterChange("actionType", undefined)}
                  className="hover:bg-primary hover:text-white rounded p-0.5 transition-colors flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Lọc theo ngày:</span>
            <Input
              type="date"
              className="h-9 w-40 text-xs"
              onChange={(e) => handleFilterChange("fromDate", e.target.value || undefined)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              className="h-9 w-40 text-xs"
              onChange={(e) => handleFilterChange("toDate", e.target.value || undefined)}
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Hành động
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nhân viên
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Danh mục
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Địa chỉ IP
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Thời gian
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground opacity-20" />
                      <p className="text-sm text-muted-foreground">Không tìm thấy bản ghi nhật ký nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr
                    key={log.id}
                    className="group hover:bg-muted/30 transition-colors duration-100"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground text-[13px]">
                          {log.actionType}
                        </span>
                        <StatusPill
                          label={log.actionType}
                          variant={ACTION_VARIANT_MAP[log.actionType] || "neutral"}
                          className="scale-90 origin-left"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[13px] text-foreground font-medium">
                        {log.employeeName || <span className="text-muted-foreground italic">Hệ thống</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {log.employeeId || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border/50">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[12px] text-muted-foreground">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[13px] text-foreground tabular-nums">
                        {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setViewingLogId(log.id)}
                        className="text-[12px] font-bold text-primary hover:underline underline-offset-4 focus:outline-none"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/5">
          <p className="text-[12px] text-muted-foreground">
            Hiển thị {pageStart}–{pageEnd} trong tổng số{" "}
            <span className="text-foreground font-bold">{data?.meta.total ?? 0}</span> bản ghi
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
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
                  "w-8 h-8 rounded-md text-xs flex items-center justify-center transition-all duration-200 border",
                  query.page === p
                    ? "bg-primary text-primary-foreground font-bold border-primary shadow-sm"
                    : "bg-background text-muted-foreground hover:bg-muted border-border hover:border-muted-foreground/30",
                ].join(" ")}
              >
                {p}
              </button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-xs"
              disabled={!data || query.page === totalPages || totalPages === 0}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              →
            </Button>
          </div>
        </div>
      </PageCard>

      {/* Detail Drawer */}
      <ActivityLogDetailDrawer
        logId={viewingLogId}
        onClose={() => setViewingLogId(null)}
      />
    </div>
  )
}
