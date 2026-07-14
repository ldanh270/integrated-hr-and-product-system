import { APPLICATION_STATUS, APPLICATION_TYPE_LABELS } from "@/config/entities/attendance.config"
import type { IApplication } from "@/lib/api/application.api"

import { ArrowLeft, Check, Home, RefreshCw, X } from "lucide-react"

interface ApplicationDetailProps {
  application: IApplication | null
  isLoading: boolean
  mode: "mine" | "manage" | "all"
  onBack: () => void
  onApprove?: (app: IApplication) => void
  onReject?: (app: IApplication) => void
  onSwapConfirm?: (app: IApplication) => void
  onSwapReject?: (app: IApplication) => void
}

export function ApplicationDetail({
  application,
  isLoading,
  mode,
  onBack,
  onApprove,
  onReject,
  onSwapConfirm,
  onSwapReject,
}: ApplicationDetailProps) {
  if (isLoading || !application) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-full text-muted-foreground animate-in fade-in">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p>Đang tải chi tiết đơn...</p>
      </div>
    )
  }

  const isPending = application.status === APPLICATION_STATUS.PENDING
  const isPartnerPending = application.status === APPLICATION_STATUS.PARTNER_PENDING
  const typeLabel = APPLICATION_TYPE_LABELS[application.type] || application.type

  // Render detail fields dynamically based on application type
  const renderDetailTable = () => {
    switch (application.type) {
      case "leave":
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Từ ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Đến ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">Lý do</th>
          </>
        )
      case "overtime":
      case "late_early":
      case "shift_swap":
      case "work_from_home":
      default:
        return (
          <>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Từ ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left whitespace-nowrap">
              Đến ngày
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-left w-full">
              Chi tiết / Lý do
            </th>
          </>
        )
    }
  }

  const renderDetailRow = () => {
    switch (application.type) {
      case "leave": {
        return (
          <>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.startDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.endDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
      }
      default:
        return (
          <>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.startDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">
              {new Date(application.endDate).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-4 text-foreground">{application.reason || "-"}</td>
          </>
        )
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-muted-foreground">Đơn thư</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-muted-foreground">{typeLabel}</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold text-foreground">Chi tiết đơn thư</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <Home size={18} />
          </button>
          {/* Actions for Manager */}
          {mode === "manage" && isPending && (
            <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
              <button
                onClick={() => {
                  onApprove?.(application)
                }}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-transparent hover:border-emerald-200 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check size={12} strokeWidth={3} />
                </div>
                Duyệt đơn
              </button>
              <button
                onClick={() => {
                  onReject?.(application)
                }}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full border border-transparent hover:border-red-200 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <X size={12} strokeWidth={3} />
                </div>
                Không duyệt
              </button>
            </div>
          )}
          {/* Actions for Swap Partner */}
          {mode === "manage" && isPartnerPending && (
            <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
              <button
                onClick={() => {
                  onSwapConfirm?.(application)
                }}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-transparent hover:border-emerald-200 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check size={12} strokeWidth={3} />
                </div>
                Đồng ý đổi ca
              </button>
              <button
                onClick={() => {
                  onSwapReject?.(application)
                }}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full border border-transparent hover:border-red-200 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <X size={12} strokeWidth={3} />
                </div>
                Không duyệt đổi ca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/10">
        {/* Section 1: Thông tin đơn */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Thông tin đơn
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Mã đơn</span>
              <span className="text-sm font-semibold text-foreground">
                {application.id.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ngày tạo</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(application.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Người nộp đơn</span>
              <span className="text-sm font-semibold text-primary">
                {application.employeeId.substring(0, 10)} -{" "}
                {application.employee?.fullName || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Người duyệt</span>
              <span className="text-foreground font-semibold mt-1">
                {application.approvedBy?.fullName ||
                  application.assignedTo?.fullName ||
                  "Chưa phân công"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Ngày duyệt</span>
              <span className="text-sm font-semibold text-foreground">
                {application.status !== APPLICATION_STATUS.PENDING &&
                application.status !== APPLICATION_STATUS.CANCELLED
                  ? new Date(application.updatedAt).toLocaleDateString("vi-VN")
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Vị trí</span>
              <span className="text-sm font-semibold text-foreground">Nhân viên</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Trạng thái</span>
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    application.status === APPLICATION_STATUS.APPROVED
                      ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                      : application.status === APPLICATION_STATUS.REJECTED
                        ? "border-red-600 text-red-600 bg-red-50"
                        : application.status === APPLICATION_STATUS.PARTNER_PENDING
                          ? "border-orange-500 text-orange-500 bg-orange-50"
                          : "border-amber-600 text-amber-600 bg-amber-50"
                  }`}
                >
                  {application.status === APPLICATION_STATUS.PENDING
                    ? "Đang duyệt"
                    : application.status === APPLICATION_STATUS.PARTNER_PENDING
                      ? "Chờ xác nhận đổi ca"
                      : application.status === APPLICATION_STATUS.APPROVED
                        ? "Đã duyệt"
                        : application.status === APPLICATION_STATUS.REJECTED
                          ? "Không duyệt"
                          : application.status}
                </span>
              </div>
            </div>
            {application.status === APPLICATION_STATUS.REJECTED && application.rejectReason && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Lý do không duyệt</span>
                <span className="text-sm font-semibold text-foreground break-words whitespace-pre-wrap">
                  {application.rejectReason}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Thời gian */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Thời gian
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/10 border-b border-border text-xs uppercase tracking-wider">
                <tr>{renderDetailTable()}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30 transition-colors">{renderDetailRow()}</tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
