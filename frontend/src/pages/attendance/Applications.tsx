"use client"

import { ApplicationCard } from "@/components/attendance/ApplicationCard"
import { ApplicationSkeleton } from "@/components/attendance/ApplicationSkeleton"
import { CancelDialog } from "@/components/attendance/CancelDialog"
import { RejectDialog } from "@/components/attendance/RejectDialog"
import { SubmitApplicationModal } from "@/components/attendance/SubmitApplicationModal"
import { APP_TYPE_META } from "@/components/attendance/attendance-ui.meta"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplication } from "@/lib/api/application.api"
import { useAuthStore } from "@/store/auth-store"

import { useState } from "react"

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileCheck2,
  FilePlus2,
  FileText,
  FileX2,
  Hourglass,
  RefreshCw,
  X,
} from "lucide-react"

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
] as const

export default function Applications() {
  const { user } = useAuthStore()
  const isManager =
    user && ["admin", "hr_manager", "general_manager", "team_leader"].includes(user.role)
  const [activeTab, setActiveTab] = useState<"mine" | "manage">("mine")

  const myApps = useMyApplications()
  const manageApps = useManageApplications()

  const currentHooks = activeTab === "mine" ? myApps : manageApps
  const {
    applications,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    totalPages,
    total,
    refetch,
    stats,
  } = currentHooks

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đơn từ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem lịch sử, tạo đơn mới và quản lý đơn từ
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <FilePlus2 size={16} />
          Tạo đơn mới
        </button>
      </div>

      {isManager && (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full overflow-x-auto self-start">
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === "mine"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đơn của tôi
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === "manage"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Quản lý đơn
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Chờ duyệt",
            value: stats.pending,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
            icon: Hourglass,
          },
          {
            label: "Đã duyệt",
            value: stats.approved,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            icon: FileCheck2,
          },
          {
            label: "Từ chối",
            value: stats.rejected,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100",
            icon: FileX2,
          },
          {
            label: "Đã hủy",
            value: stats.cancelled,
            color: "text-slate-500",
            bg: "bg-slate-50",
            border: "border-slate-100",
            icon: X,
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`flex items-center gap-3 p-3.5 rounded-xl border ${stat.bg} ${stat.border}`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className={`text-xl font-bold leading-none ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value as typeof statusFilter)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 bg-white focus:outline-none appearance-none"
          >
            <option value="all">Tất cả loại đơn</option>
            {Object.entries(APP_TYPE_META).map(([type, m]) => (
              <option key={type} value={type}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <button
          onClick={refetch}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ApplicationSkeleton key={i} />)
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <FileText size={32} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">Chưa có đơn nào</p>
              <p className="text-sm text-slate-400 mt-1">
                {statusFilter !== "all"
                  ? `Không có đơn ở trạng thái "${STATUS_TABS.find((t) => t.value === statusFilter)?.label}"`
                  : `Nhấn "Tạo đơn mới" để bắt đầu`}
              </p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2.5 text-sm font-bold"
            >
              <FilePlus2 size={15} />
              Tạo đơn đầu tiên
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Hiển thị {applications.length} / {total} đơn
            </p>
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                mode={activeTab}
                onCancelRequest={setCancelTarget}
                onApproveRequest={(app) => manageApps.handleApprove(app.id)}
                onRejectRequest={setRejectTarget}
                processingId={manageApps.processingId}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft size={13} />
            Trước
          </button>
          <span className="text-xs text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Sau
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showSubmitModal && (
        <SubmitApplicationModal onClose={() => setShowSubmitModal(false)} onSuccess={refetch} />
      )}
      {cancelTarget && (
        <CancelDialog
          app={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          isLoading={myApps.cancellingId === cancelTarget.id}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          app={rejectTarget}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          isLoading={manageApps.processingId === rejectTarget.id}
        />
      )}
    </div>
  )
}
