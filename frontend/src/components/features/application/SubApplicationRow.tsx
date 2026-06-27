"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import { Check, ChevronDown, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { APPLICATION_STATUS, APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"
import { formatDate } from "@/lib/utils"
import { SubApplicationDetailFields } from "./SubApplicationDetailFields"

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



export function SubApplicationRow({
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
  const isShiftSwap = app.type === APPLICATION_TYPES.SHIFT_SWAP.LABEL
  const isPartner =
    isShiftSwap &&
    swapDetail?.swapWithEmployeeId &&
    swapDetail.swapWithEmployeeId === currentUserId

  const isPartnerPending = Boolean(isPartner && swapDetail.partnerApprovalStatus === "pending")
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

  const statusBadge = STATUS_BADGE[app.status as keyof typeof STATUS_BADGE]
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
                onClick={() => { onApprove(app) }}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-transparent hover:border-emerald-200 transition-all"
              >
                <Check size={11} strokeWidth={3} />
                Duyệt
              </button>
              <button
                onClick={() => { onReject(app) }}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-full border border-transparent hover:border-red-200 transition-all"
              >
                <X size={11} strokeWidth={3} />
                Từ chối
              </button>
            </div>
          )}

          {/* Partner approve actions */}
          {isPartnerPending && (
            <div className="flex items-center gap-2 mr-2" onClick={(e) => { e.stopPropagation() }}>
              <button
                disabled={partnerApproveMutation.isPending}
                onClick={() => { partnerApproveMutation.mutate({ id: app.id, isApproved: true }) }}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-transparent hover:border-emerald-200 transition-all disabled:opacity-50"
              >
                <Check size={11} strokeWidth={3} />
                Đồng ý
              </button>
              <button
                disabled={partnerApproveMutation.isPending}
                onClick={() => { partnerApproveMutation.mutate({ id: app.id, isApproved: false }) }}
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
          <SubApplicationDetailFields app={app} />
        </div>
      )}
    </div>
  )
}
