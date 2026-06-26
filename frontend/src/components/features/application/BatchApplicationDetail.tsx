"use client"

import { APPLICATION_STATUS, APPLICATION_TYPE_LABELS, REGIME_TYPE } from "@/config/entities/attendance.config"
import type { IApplicationBatch } from "@/lib/api/application-batch.api"
import type { IApplication } from "@/lib/api/application.api"
import { useAuthStore } from "@/store/auth-store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { applicationBatchApi } from "@/lib/api/application-batch.api"
import { toast } from "sonner"
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Layers,
  RefreshCw,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────

interface BatchApplicationDetailProps {
  batch: IApplicationBatch | null
  isLoading: boolean
  mode: "mine" | "manage"
  onBack: () => void
  onApproveSingle?: (app: IApplication) => void
  onRejectSingle?: (app: IApplication) => void
}

// ─── Status badge config ──────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "border-amber-500 text-amber-600 bg-amber-50" },
  approved: { label: "Đã duyệt", cls: "border-emerald-500 text-emerald-600 bg-emerald-50" },
  rejected: { label: "Từ chối", cls: "border-red-400 text-red-600 bg-red-50" },
  cancelled: { label: "Đã hủy", cls: "border-slate-400 text-slate-500 bg-slate-50" },
}

const PARTNER_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Đang chờ phản hồi", cls: "text-amber-600 bg-amber-50 border-amber-300" },
  approved: { label: "Đồng ý", cls: "text-emerald-600 bg-emerald-50 border-emerald-300" },
  rejected: { label: "Từ chối", cls: "text-red-600 bg-red-50 border-red-300" },
}

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

function formatShiftTime(minutes?: number) {
  if (minutes === undefined) return "--:--"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

function getShiftLabel(shift?: { name?: string; startTime?: number; endTime?: number } | null) {
  if (!shift) return null
  const time = `${formatShiftTime(shift.startTime)} - ${formatShiftTime(shift.endTime)}`
  return shift.name ? `${shift.name} (${time})` : time
}

// ─── SubApplicationRow ────────────────────────────────────────

function SubApplicationRow({
  app,
  index,
  mode,
  currentUserId,
  onApprove,
  onReject,
}: {
  app: IApplication
  index: number
  mode: "mine" | "manage"
  currentUserId: string | undefined
  onApprove: (app: IApplication) => void
  onReject: (app: IApplication) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()

  const swapDetail = (app.shiftSwapDetail || app.detail) as Record<string, unknown> | undefined
  const isShiftSwap = app.type === "shift_swap"
  const isPartner =
    isShiftSwap &&
    swapDetail?.swapWithEmployeeId &&
    swapDetail.swapWithEmployeeId === currentUserId

  const isPartnerPending = Boolean(isPartner && swapDetail && swapDetail.partnerApprovalStatus === "pending")
  const isPending = app.status === APPLICATION_STATUS.PENDING

  const partnerApproveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const res = await apiClient.patch(`/applications/${id}/partner-approve`, { isApproved })
      return res.data
    },
    onSuccess: () => {
      toast.success("Đã phản hồi yêu cầu đổi ca")
      void queryClient.invalidateQueries({ queryKey: ["application-batches"] })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error.response?.data?.error?.message || "Lỗi khi xử lý")
    },
  })

  const statusBadge = STATUS_BADGE[app.status as keyof typeof STATUS_BADGE] || { label: app.status, cls: "border-slate-300 text-slate-500" }
  const partnerStatus = swapDetail?.partnerApprovalStatus
  const partnerBadge = partnerStatus && typeof partnerStatus === "string" && partnerStatus in PARTNER_STATUS_BADGE ? PARTNER_STATUS_BADGE[partnerStatus as keyof typeof PARTNER_STATUS_BADGE] : null

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Row header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
          expanded && "bg-muted/20",
        )}
        onClick={() => { setExpanded((v) => !v) }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") setExpanded((v) => !v) }}
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {formatDate(app.startDate)}
              {app.startDate !== app.endDate && ` — ${formatDate(app.endDate)}`}
            </span>
            {isShiftSwap && partnerBadge && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full border w-fit mt-0.5", partnerBadge.cls)}>
                Đối tác: {partnerBadge.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action buttons (visible without expanding) */}
          {mode === "manage" && isPending && !isPartner && (
            <div className="flex items-center gap-2 mr-2" onClick={(e) => { e.stopPropagation() }}>
              <button
                onClick={() => onApprove(app)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-transparent hover:border-emerald-200 transition-all"
              >
                <Check size={11} strokeWidth={3} />
                Duyệt
              </button>
              <button
                onClick={() => onReject(app)}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-full border border-transparent hover:border-red-200 transition-all"
              >
                <X size={11} strokeWidth={3} />
                Từ chối
              </button>
            </div>
          )}

          {/* Partner approve actions */}
          {isPartnerPending && (
            <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={partnerApproveMutation.isPending}
                onClick={() => partnerApproveMutation.mutate({ id: app.id, isApproved: true })}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-transparent hover:border-emerald-200 transition-all disabled:opacity-50"
              >
                <Check size={11} strokeWidth={3} />
                Đồng ý
              </button>
              <button
                disabled={partnerApproveMutation.isPending}
                onClick={() => partnerApproveMutation.mutate({ id: app.id, isApproved: false })}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-full border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
              >
                <X size={11} strokeWidth={3} />
                Từ chối
              </button>
            </div>
          )}

          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", statusBadge.cls)}>
            {statusBadge.label}
          </span>
          {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/5">
          <DetailFields app={app} />
        </div>
      )}
    </div>
  )
}

// ─── Detail fields per type ───────────────────────────────────

function DetailFields({ app }: { app: IApplication }) {
  const swapDetail = (app.shiftSwapDetail || app.detail) as Record<string, any> | undefined
  const leaveDetail = app.detail as Record<string, unknown> | undefined

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
      {app.type === "leave" && (
        <>
          <Field label="Kiểu nghỉ" value={String(leaveDetail?.leaveType ?? "—")} />
          <Field
            label="Chế độ"
            value={leaveDetail?.regimeType === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
          />
          <Field label="Từ ngày" value={formatDate(app.startDate)} />
          <Field label="Đến ngày" value={formatDate(app.endDate)} />
          {app.reason && <Field label="Lý do" value={app.reason} span />}
        </>
      )}

      {app.type === "shift_swap" && (
        <>
          <Field label="Ngày" value={formatDate(app.startDate)} />
          <Field
            label="Ca của bạn"
            value={getShiftLabel(swapDetail?.employeeShift?.shift) ?? swapDetail?.employeeShiftId ?? "—"}
          />
          {swapDetail?.swapWithEmployee && (
            <Field label="Đổi với" value={swapDetail.swapWithEmployee.fullName} />
          )}
          {swapDetail?.swapWithShift && (
            <Field label="Ca đổi" value={getShiftLabel(swapDetail.swapWithShift?.shift) ?? "—"} />
          )}
          <Field
            label="Phản hồi đối tác"
            value={
              swapDetail?.partnerApprovalStatus === "approved"
                ? "Đã đồng ý"
                : swapDetail?.partnerApprovalStatus === "rejected"
                  ? "Đã từ chối"
                  : "Đang chờ"
            }
          />
        </>
      )}

      {app.type === "overtime" && (
        <>
          <Field label="Ngày tăng ca" value={formatDate(app.startDate)} />
          <Field
            label="Ca làm việc"
            value={
              getShiftLabel(
                (app.detail as Record<string, any>)?.employeeShift?.shift,
              ) ?? "—"
            }
          />
          {app.reason && <Field label="Lý do" value={app.reason} span />}
        </>
      )}

      {app.type === "late_early" && (
        <>
          <Field label="Ngày làm việc" value={formatDate(app.startDate)} />
          <Field
            label="Loại"
            value={(app.detail as Record<string, any>)?.isLate ? "Đi muộn" : "Về sớm"}
          />
          <Field
            label="Số phút"
            value={`${(app.detail as Record<string, any>)?.durationMinutes ?? "—"} phút`}
          />
        </>
      )}

      {app.type === "work_from_home" && (
        <>
          <Field label="Từ ngày" value={formatDate(app.startDate)} />
          <Field label="Đến ngày" value={formatDate(app.endDate)} />
          {(app.detail as Record<string, any>)?.location && (
            <Field label="Hình thức" value={(app.detail as Record<string, any>).location} />
          )}
        </>
      )}

      {app.rejectReason && (
        <Field label="Lý do từ chối" value={app.rejectReason} span className="text-red-600" />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  span,
  className,
}: {
  label: string
  value: string
  span?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", span && "col-span-full")}>
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", className)}>{value}</span>
    </div>
  )
}

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
              onClick={() => cancelMutation.mutate(batch.id)}
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
