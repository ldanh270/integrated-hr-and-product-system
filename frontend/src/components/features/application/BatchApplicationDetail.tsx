"use client"

import { APPLICATION_STATUS, APPLICATION_TYPE_LABELS } from "@/config/entities/attendance.config"
import type { IApplicationBatch } from "@/lib/api/application-batch.api"
import type { IApplication } from "@/lib/api/application.api"
import { useAuthStore } from "@/store/auth-store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applicationBatchApi } from "@/lib/api/application-batch.api"
import { toast } from "sonner"
import {
  FileText,
  Home,
  Layers,
  RefreshCw,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────

interface BatchApplicationDetailProps {
  batch: IApplicationBatch | null
  isLoading: boolean
  mode: "mine" | "manage" | "all"
  onBack: () => void
  onApproveSingle?: (app: IApplication) => void
  onRejectSingle?: (app: IApplication) => void
}

import { SubApplicationRow } from "./SubApplicationRow"
import { formatDate } from "@/lib/utils"

// ─── BatchApplicationDetail ───────────────────────────────────

export function BatchApplicationDetail({
  batch,
  isLoading,
  mode,
  onBack,
  onApproveSingle,
  onRejectSingle,
}: BatchApplicationDetailProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: (id: string) => applicationBatchApi.cancel(id),
    onSuccess: () => {
      toast.success("Đã hủy đơn")
      void queryClient.invalidateQueries({ queryKey: ["application-batches"] })
      onBack()
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error.response?.data?.error?.message || "Lỗi khi hủy")
    },
  })

  if (isLoading || !batch) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-full text-muted-foreground animate-in fade-in">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p>Đang tải chi tiết đơn...</p>
      </div>
    )
  }

  const typeLabel = APPLICATION_TYPE_LABELS[batch.type] ?? batch.type
  const allPending = batch.applications.every((a) => a.status === APPLICATION_STATUS.PENDING)

  const pendingCount = batch.applications.filter((a) => a.status === APPLICATION_STATUS.PENDING).length
  const approvedCount = batch.applications.filter((a) => a.status === "approved").length
  const rejectedCount = batch.applications.filter((a) => a.status === "rejected").length

  return (
    <div className="flex flex-col h-full w-full bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <FileText size={18} />
          </button>
          <span className="text-muted-foreground">Đơn thư</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-muted-foreground">{typeLabel}</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-primary" />
            Đơn ({batch.applications.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground">
            <Home size={18} />
          </button>
          {/* Cancel batch (owner only, only if any pending) */}
          {mode === "mine" && allPending && (
            <button
              onClick={() => { cancelMutation.mutate(batch.id) }}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 transition-all disabled:opacity-50 ml-4"
            >
              <X size={13} />
              Hủy đơn
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
        {/* Section 1: Batch meta */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Thông tin đơn</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-10">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Mã đơn</span>
              <span className="text-sm font-semibold text-foreground">{batch.id.substring(0, 12).toUpperCase()}…</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Loại đơn</span>
              <span className="text-sm font-semibold text-foreground">{typeLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Số lượng đơn</span>
              <span className="text-sm font-semibold text-foreground">{batch.applications.length} đơn</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Người nộp</span>
              <span className="text-sm font-semibold text-primary">{batch.employee?.fullName ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Người duyệt</span>
              <span className="text-sm font-semibold text-foreground">{batch.assignedTo?.fullName ?? "Chưa phân công"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Ngày tạo</span>
              <span className="text-sm font-semibold text-foreground">{formatDate(batch.createdAt)}</span>
            </div>
          </div>
          {/* Summary badges */}
          <div className="px-6 pb-5 flex items-center gap-3 flex-wrap">
            {pendingCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-amber-400 text-amber-600 bg-amber-50 font-medium">
                {pendingCount} chờ duyệt
              </span>
            )}
            {approvedCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-emerald-400 text-emerald-600 bg-emerald-50 font-medium">
                {approvedCount} đã duyệt
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-red-300 text-red-600 bg-red-50 font-medium">
                {rejectedCount} từ chối
              </span>
            )}
          </div>
        </div>

        {/* Section 2: Sub-applications list */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Danh sách đơn
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {batch.applications.map((app, idx) => (
              <SubApplicationRow
                key={app.id}
                app={app}
                index={idx}
                mode={mode}
                currentUserId={user?.personalEmployeeId ?? user?.id}
                onApprove={onApproveSingle ?? (() => {})}
                onReject={onRejectSingle ?? (() => {})}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
