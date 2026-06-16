"use client"

import { PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import ShiftChangeRequestDialog from "@/components/features/attendance/shift-change-request-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_VARIANTS,
  APPLICATION_TYPE_LABELS,
  APPLICATION_STATUS,
} from "@/config/entities/attendance.config"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { useAuthStore } from "@/store/auth-store"
import type { IApplication } from "@/lib/api/application.api"
import { formatDate } from "@/lib/utils"

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronDown,
  Clock,
  FileCheck2,
  FilePlus2,
  FileText,
  FileX2,
  Hourglass,
  Laptop,
  Loader2,
  Plus,
  RefreshCw,
  Repeat2,
  Send,
  Stethoscope,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

// ─── Type metadata ────────────────────────────────────────────────────────────

const APP_TYPE_META: Record<
  string,
  {
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    color: string
    bg: string
    border: string
    hint: string
  }
> = {
  leave: {
    label: "Nghỉ phép",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    hint: "Xin nghỉ phép năm, thai sản, ốm...",
  },
  overtime: {
    label: "Làm thêm giờ",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hint: "Đăng ký làm thêm giờ ngoài ca",
  },
  work_from_home: {
    label: "WFH",
    icon: Laptop,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    hint: "Làm việc từ xa / tại nhà",
  },
  shift_swap: {
    label: "Đổi ca",
    icon: Repeat2,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    hint: "Đề xuất đổi ca với đồng nghiệp",
  },
  business_trip: {
    label: "Công tác",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    hint: "Đi công tác theo yêu cầu",
  },
  late_early: {
    label: "Đi muộn/Về sớm",
    icon: CalendarClock,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hint: "Thông báo đi muộn hoặc về sớm",
  },
  regime: {
    label: "Thai sản/Bệnh",
    icon: Stethoscope,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    hint: "Chế độ thai sản, ốm đau...",
  },
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

interface SubmitModalProps {
  onClose: () => void
  onSuccess: () => void
}

const LEAVE_TYPE_OPTIONS = [
  { value: "annual_leave", label: "Nghỉ phép năm" },
  { value: "sick_leave", label: "Nghỉ ốm" },
  { value: "maternity_leave", label: "Thai sản" },
  { value: "bereavement_leave", label: "Nghỉ tang" },
  { value: "marriage_leave", label: "Nghỉ cưới" },
  { value: "unpaid_leave", label: "Nghỉ không lương" },
  { value: "other", label: "Khác" },
] as const

function SubmitApplicationModal({ onClose, onSuccess }: SubmitModalProps) {
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [step, setStep] = useState<"type" | "details">("type")
  const [selectedType, setSelectedType] = useState<string>("")
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    leaveType: "annual_leave" as string,
    leaveRegimeType: "paid" as "paid" | "unpaid",
    employeeShiftId: "",
    durationMinutes: 30,
    isLate: true,
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    location: "",
    destination: "",
    purpose: "",
    regimeType: "paid" as "paid" | "unpaid",
    reducedMinutesPerDay: 0,
    applyToStart: false,
    applyToEnd: false,
    documentUrl: "",
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu")
      return
    }

    let detail: Record<string, unknown> = {}

    switch (selectedType) {
      case "leave":
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break
      case "overtime":
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break
      case "late_early":
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        if (form.durationMinutes < 1 || form.durationMinutes > 480) {
          toast.error("Số phút muộn/sớm phải từ 1 đến 480")
          return
        }
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          ...(form.isLate
            ? { lateMinutes: form.durationMinutes }
            : { earlyMinutes: form.durationMinutes }),
        }
        break
      case "shift_swap":
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca của bạn")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim()) detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break
      case "work_from_home":
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break
      case "business_trip":
        if (!form.destination.trim()) {
          toast.error("Vui lòng nhập địa điểm công tác")
          return
        }
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break
      case "regime":
        detail = {
          regimeType: form.regimeType,
          reducedMinutesPerDay: form.reducedMinutesPerDay,
          applyToStart: form.applyToStart,
          applyToEnd: form.applyToEnd,
        }
        if (form.documentUrl.trim()) detail.documentUrl = form.documentUrl.trim()
        break
    }

    const success = await submitApplication({
      type: selectedType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      detail,
    })

    if (success) {
      onSuccess()
      onClose()
    }
  }

  const meta = APP_TYPE_META[selectedType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button
                type="button"
                onClick={() => setStep("type")}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {step === "type" ? "Chọn loại đơn" : `Tạo đơn ${meta?.label}`}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === "type" && (
            <div className="p-5 grid grid-cols-2 gap-3">
              {Object.entries(APP_TYPE_META).map(([type, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type)
                      setStep("details")
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all ${m.border} ${m.bg}`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${m.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{m.hint}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {step === "details" && meta && (
            <form id="submit-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
                <meta.icon size={16} className={meta.color} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* ── LEAVE ── */}
              {selectedType === "leave" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại nghỉ phép *</label>
                    <select
                      value={form.leaveType}
                      onChange={(e) => set("leaveType", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {LEAVE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["paid", "unpaid"] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => set("leaveRegimeType", rt)}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold ${
                            form.leaveRegimeType === rt ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500"
                          }`}
                        >
                          {rt === "paid" ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── OVERTIME ── */}
              {selectedType === "overtime" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">ID Ca làm việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="CUID ca làm việc..."
                    value={form.employeeShiftId}
                    onChange={(e) => set("employeeShiftId", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              )}

              {/* ── LATE / EARLY ── */}
              {selectedType === "late_early" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Ca làm việc *</label>
                    <input
                      type="text"
                      required
                      placeholder="CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => set("employeeShiftId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([true, false] as const).map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => set("isLate", v)}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold ${
                            form.isLate === v ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500"
                          }`}
                        >
                          {v ? "Đi muộn" : "Về sớm"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Số phút (1–480) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={480}
                      value={form.durationMinutes}
                      onChange={(e) => set("durationMinutes", Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {/* ── SHIFT SWAP ── */}
              {selectedType === "shift_swap" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Ca của bạn *</label>
                    <input
                      type="text"
                      required
                      placeholder="CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => set("employeeShiftId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Nhân viên muốn đổi</label>
                    <input
                      type="text"
                      placeholder="CUID nhân viên..."
                      value={form.swapWithEmployeeId}
                      onChange={(e) => set("swapWithEmployeeId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                </>
              )}

              {/* ── WFH ── */}
              {selectedType === "work_from_home" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Địa điểm làm việc</label>
                  <input
                    type="text"
                    placeholder="VD: Tại nhà, Quán cà phê..."
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* ── BUSINESS TRIP ── */}
              {selectedType === "business_trip" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Địa điểm công tác *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Hà Nội, TP.HCM..."
                      value={form.destination}
                      onChange={(e) => set("destination", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Mục đích chuyến đi</label>
                    <input
                      type="text"
                      placeholder="Mô tả mục đích..."
                      value={form.purpose}
                      onChange={(e) => set("purpose", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {/* ── REGIME ── */}
              {selectedType === "regime" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["paid", "unpaid"] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => set("regimeType", rt)}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold ${
                            form.regimeType === rt ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500"
                          }`}
                        >
                          {rt === "paid" ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Số phút giảm/ngày *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={480}
                      value={form.reducedMinutesPerDay}
                      onChange={(e) => set("reducedMinutesPerDay", Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Lý do (tối thiểu 5 ký tự)</label>
                <textarea rows={3} minLength={5} placeholder="Nhập lý do..." value={form.reason} onChange={(e) => set("reason", e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
              </div>
            </form>
          )}
        </div>

        {step === "details" && (
          <div className="border-t border-slate-100 px-5 py-4 flex gap-3 bg-slate-50">
            <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Quay lại</Button>
            <Button type="submit" form="submit-form" disabled={isSubmitting} className="flex-1 gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Gửi đơn
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({ app, onCancel, onConfirm, isLoading }: { app: IApplication; onCancel: () => void; onConfirm: () => void; isLoading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Xác nhận hủy đơn?</h3>
          <p className="text-sm text-slate-500">
            Hủy đơn <strong>{APPLICATION_TYPE_LABELS[app.type] || app.type}</strong> từ {formatDate(app.startDate)}?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Không</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────

function RejectDialog({ 
  onCancel, 
  onConfirm, 
  isLoading 
}: { 
  onCancel: () => void; 
  onConfirm: (reason: string) => void; 
  isLoading: boolean 
}) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối")
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <X size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Từ chối đơn?</h3>
          <p className="text-sm text-slate-500">Nhập lý do từ chối để thông báo đến nhân viên.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Lý do từ chối *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do..."
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={onCancel}>Hủy</Button>
            <Button variant="destructive" className="flex-1" type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
] as const

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Applications() {
  const { user } = useAuthStore()
  const isManager = user && ["admin", "hr_manager", "general_manager", "team_leader"].includes(user.role)

  const [activeTab, setActiveTab] = useState<"mine" | "manage">("mine")
  const myApps = useMyApplications()
  const manageApps = useManageApplications()

  const currentHook = activeTab === "mine" ? myApps : manageApps

  const [sheetOpen, setSheetOpen] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTargetId) return
    await manageApps.handleReject(rejectTargetId, reason)
    setRejectTargetId(null)
  }

  const handleRejectClick = (id: string) => {
    setRejectTargetId(id)
  }

  const renderTable = (apps: IApplication[], isLoading: boolean, mode: "mine" | "manage") => (
    <div className="overflow-x-auto">
      <Table className="text-sm">
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Loại</TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Thời gian</TableHead>
            {mode === "manage" && <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Nhân viên</TableHead>}
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Lý do</TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Trạng thái</TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
          ) : apps.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Chưa có đơn nào.</TableCell></TableRow>
          ) : (
            apps.map((app) => (
              <TableRow key={app.id} className="hover:bg-muted/30">
                <TableCell className="px-4 py-4 font-medium">{APPLICATION_TYPE_LABELS[app.type] || app.type}</TableCell>
                <TableCell className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {formatDate(app.startDate)}
                  {app.endDate && app.endDate !== app.startDate && ` → ${formatDate(app.endDate)}`}
                </TableCell>
                {mode === "manage" && (
                  <TableCell className="px-4 py-4">
                    <p className="font-medium">{app.employee?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{app.employee?.email}</p>
                  </TableCell>
                )}
                <TableCell className="px-4 py-4 max-w-40 truncate text-muted-foreground" title={app.reason}>{app.reason || "—"}</TableCell>
                <TableCell className="px-4 py-4">
                  <StatusPill
                    label={APPLICATION_STATUS_LABELS[app.status] || app.status}
                    variant={APPLICATION_STATUS_VARIANTS[app.status] || "neutral"}
                  />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {mode === "mine" && app.status === APPLICATION_STATUS.PENDING && (
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => setCancelTarget(app)}>Hủy</Button>
                    )}
                    {mode === "manage" && app.status === APPLICATION_STATUS.PENDING && (
                      <>
                        <Button size="sm" className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => manageApps.handleApprove(app.id)} disabled={manageApps.processingId === app.id}>Duyệt</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200" onClick={() => handleRejectClick(app.id)}>Từ chối</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderPagination = (hook: { page: number; totalPages: number; setPage: (v: number) => void }) => (
    hook.totalPages > 1 && (
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button variant="outline" size="sm" onClick={() => hook.setPage(hook.page - 1)} disabled={hook.page <= 1} className="rounded-full gap-2">
          <ArrowLeft size={14} /> Trước
        </Button>
        <span className="text-sm font-medium text-muted-foreground">{hook.page} / {hook.totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => hook.setPage(hook.page + 1)} disabled={hook.page >= hook.totalPages} className="rounded-full gap-2">
          Sau <ArrowRight size={14} />
        </Button>
      </div>
    )
  )

  return (
    <div className="container px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Đơn từ & Yêu cầu"
        description="Quản lý các loại đơn nghỉ phép, tăng ca và đổi ca làm việc."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-full" onClick={() => setShowSubmitModal(true)}>
              <FilePlus2 size={16} /> Tạo đơn mới
            </Button>
            <Button className="gap-2 rounded-full" onClick={() => setSheetOpen(true)}>
              <Plus size={16} /> Đổi ca
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chờ duyệt", value: currentHook.stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: Hourglass },
          { label: "Đã duyệt", value: currentHook.stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: FileCheck2 },
          { label: "Từ chối", value: currentHook.stats.rejected, color: "text-red-600", bg: "bg-red-50", icon: FileX2 },
          { label: "Tổng số", value: currentHook.stats.total, color: "text-slate-600", bg: "bg-slate-50", icon: FileText },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <PageCard key={stat.label} className={`p-4 ${stat.bg} border-none shadow-none`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} border border-current/10`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </PageCard>
          )
        })}
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="mine">Đơn của tôi</TabsTrigger>
              {isManager && <TabsTrigger value="manage">Quản lý phê duyệt</TabsTrigger>}
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={currentHook.refetch} className="gap-2 h-8 text-xs">
                <RefreshCw size={14} className={currentHook.isRefreshing ? "animate-spin" : ""} /> Làm mới
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full overflow-x-auto self-start">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { currentHook.setStatusFilter(tab.value as any); currentHook.setPage(1) }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    currentHook.statusFilter === tab.value
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
                value={currentHook.typeFilter}
                onChange={(e) => { currentHook.setTypeFilter(e.target.value); currentHook.setPage(1) }}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 bg-white focus:outline-none appearance-none"
              >
                <option value="all">Tất cả loại đơn</option>
                {Object.entries(APP_TYPE_META).map(([type, m]) => (
                  <option key={type} value={type}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <TabsContent value="mine">
            <PageCard className="p-0 overflow-hidden" noBorder={false}>
              {renderTable(myApps.applications, myApps.isLoading, "mine")}
            </PageCard>
            {renderPagination(myApps)}
          </TabsContent>

          {isManager && (
            <TabsContent value="manage">
              <PageCard className="p-0 overflow-hidden" noBorder={false}>
                {renderTable(manageApps.applications, manageApps.isLoading, "manage")}
              </PageCard>
              {renderPagination(manageApps)}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <ShiftChangeRequestDialog open={sheetOpen} onOpenChange={setSheetOpen} />
      
      {showSubmitModal && (
        <SubmitApplicationModal onClose={() => setShowSubmitModal(false)} onSuccess={myApps.refetch} />
      )}

      {cancelTarget && (
        <CancelDialog
          app={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          isLoading={myApps.cancellingId === cancelTarget.id}
        />
      )}

      {rejectTargetId && (
        <RejectDialog
          onCancel={() => setRejectTargetId(null)}
          onConfirm={handleRejectConfirm}
          isLoading={manageApps.processingId === rejectTargetId}
        />
      )}
    </div>
  )
}
