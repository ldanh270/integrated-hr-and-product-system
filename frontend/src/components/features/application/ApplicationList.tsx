import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/config/entities/attendance.config"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplication } from "@/lib/api/application.api"

import { useState } from "react"

import { ChevronLeft, ChevronRight, FileText, Filter, RefreshCw } from "lucide-react"

const STATUS_LABELS: Record<string, { label: string; colorClass: string }> = {
  [APPLICATION_STATUS.PENDING]: {
    label: "Chờ duyệt",
    colorClass: "text-amber-600 border-amber-600 font-medium",
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: "Đã duyệt",
    colorClass: "text-emerald-600 border-emerald-600 font-medium",
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: "Không duyệt",
    colorClass: "text-red-600 border-red-600 font-medium",
  },
  [APPLICATION_STATUS.CANCELLED]: {
    label: "Đã hủy",
    colorClass: "text-slate-500 border-slate-500 font-medium",
  },
}

interface ApplicationListProps {
  mode: "mine" | "manage"
  onRowClick: (app: IApplication) => void
  hookState: ReturnType<typeof useMyApplications> | ReturnType<typeof useManageApplications>
}

export function ApplicationList({ mode, onRowClick, hookState }: ApplicationListProps) {
  const currentHooks = hookState
  const {
    applications,
    isLoading,
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
    stats,
  } = currentHooks as ReturnType<typeof useMyApplications> &
    ReturnType<typeof useManageApplications>

  const [localKeyword, setLocalKeyword] = useState(keyword)

  const STATUS_TABS = [
    { value: "all", label: "Tất cả", count: stats.total },
    { value: "pending", label: "Chờ duyệt", count: stats.pending },
    { value: "approved", label: "Đã duyệt", count: stats.approved },
    { value: "rejected", label: "Không duyệt", count: stats.rejected },
  ] as const

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Top Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(
                  tab.value as "all" | "pending" | "approved" | "rejected" | "cancelled",
                )
                setPage(1)
              }}
              className={`relative flex items-center gap-2 py-4 transition-all font-medium text-[13px] ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                  isActive
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-[280px]">
            <input
              type="text"
              value={localKeyword}
              onChange={(e) => { setLocalKeyword(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setKeyword(localKeyword)
                  setPage(1)
                }
              }}
              placeholder="Tìm kiếm họ và tên, người duyệt, mã đơn, mã nhân sự"
              className="w-full pl-4 pr-9 py-2 text-[13px] border border-input rounded-md bg-background focus:outline-none focus:border-primary transition-all text-foreground"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Filter className="text-muted-foreground" size={14} />
            </div>
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="w-full appearance-none pl-4 pr-9 py-2 text-[13px] border border-input rounded-md bg-background focus:outline-none focus:border-primary transition-all text-foreground"
            >
              <option value="all">Loại đơn</option>
              {Object.values(APPLICATION_TYPES).map((t) => (
                <option key={t.LABEL} value={t.LABEL}>
                  {t.DESCRIPTION}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="text-muted-foreground rotate-90" size={14} />
            </div>
          </div>

          <button
            onClick={() => {
              setLocalKeyword("")
              setKeyword("")
              setTypeFilter("all")
              setPage(1)
            }}
            className="text-[13px] font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors px-4 py-2 rounded-md"
          >
            Thiết lập lại
          </button>
          <button
            onClick={() => {
              setKeyword(localKeyword)
              setPage(1)
            }}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-md shadow-sm transition-all"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-background flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-muted/50 border-y border-border text-muted-foreground font-semibold whitespace-nowrap">
              <tr>
                <th className="px-4 py-4 w-[15%]">Mã đơn</th>
                {mode === "manage" && <th className="px-4 py-4 w-[15%]">Họ và tên</th>}
                {mode === "manage" && <th className="px-4 py-4 w-[10%]">Mã nhân sự</th>}
                <th className="px-4 py-4 w-[15%]">Loại đơn</th>
                <th className="px-4 py-4 w-[10%] text-center">Trạng thái</th>
                <th className="px-4 py-4 w-[10%]">Ngày tạo</th>
                <th className="px-4 py-4 w-[15%] text-center">Người tạo</th>
                <th className="px-4 py-4 w-[15%] text-center">Người duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={mode === "manage" ? 8 : 6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/70">
                      <RefreshCw className="animate-spin" size={24} />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={mode === "manage" ? 8 : 6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground/70">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-orange-400"></div>
                        <div className="absolute bottom-4 left-0 w-2 h-2 rounded-full bg-pink-400"></div>
                        <div className="absolute top-4 right-4 text-green-500 font-bold">+</div>
                        <div className="absolute bottom-2 right-2 text-blue-400 text-xl font-bold">
                          *
                        </div>
                        <div className="absolute top-8 right-8 w-2 h-2 rounded-full border-2 border-purple-400"></div>
                        <div className="bg-muted h-1 w-16 absolute -bottom-2 rounded-full"></div>
                        <FileText className="text-muted-foreground" size={48} strokeWidth={1} />
                      </div>
                      <p className="font-medium text-muted-foreground text-[13px] mt-2">
                        Không tìm thấy kết quả
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => { onRowClick(app); }}
                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 text-foreground font-medium">
                      {app.id.substring(0, 8).toUpperCase()}
                    </td>
                    {mode === "manage" && (
                      <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                        {app.employee?.fullName || "N/A"}
                      </td>
                    )}
                    {mode === "manage" && (
                      <td className="px-4 py-4 text-primary font-medium group-hover:underline">
                        {app.employeeId.substring(0, 10)}
                      </td>
                    )}
                    <td className="px-4 py-4 text-foreground font-medium">
                      {APPLICATION_TYPE_LABELS[app.type] || app.type}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-1.5 text-[11px] font-bold border rounded-full bg-transparent whitespace-nowrap ${
                            STATUS_LABELS[app.status]?.colorClass ||
                            "text-muted-foreground border-border"
                          }`}
                        >
                          {STATUS_LABELS[app.status]?.label || app.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-primary font-medium">
                          {app.employeeId.substring(0, 10)}
                        </span>
                        <span className="text-muted-foreground text-[11px] mt-0.5">
                          {app.employee?.fullName || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-muted-foreground">
                      {app.processor ? app.processor.fullName : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {!isLoading && applications.length > 0 && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-muted/20 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select className="border border-border rounded bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <span>
              Hiển thị từ {(page - 1) * 10 + 1} – {Math.min(page * 10, total)} trên tổng {total}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-primary-foreground font-semibold">
                {page}
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
