"use client"

import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import type { IApplication } from "@/lib/api/application.api"
import { useAuthStore } from "@/store/auth-store"

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  FileCheck2,
  FilePlus2,
  FileText,
  FileX2,
  Hourglass,
  Laptop,
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

const STATUS_META: Record<
  string,
  {
    label: string
    color: string
    bg: string
    border: string
    icon: React.FC<{ size?: number }>
  }
> = {
  pending: {
    label: "Chờ duyệt",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Hourglass,
  },
  approved: {
    label: "Đã duyệt",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: FileCheck2,
  },
  rejected: {
    label: "Từ chối",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: FileX2,
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: FileX2,
  },
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

interface SubmitModalProps {
  onClose: () => void
  onSuccess: () => void
}

/** Correct leave type values matching backend LEAVE_TYPE_VALUES enum */
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
    // leave
    leaveType: "annual_leave" as string,
    leaveRegimeType: "paid" as "paid" | "unpaid",
    // overtime / late_early / shift_swap
    employeeShiftId: "",
    // late_early specific
    durationMinutes: 30,
    isLate: true,
    // shift_swap
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    // work_from_home
    location: "",
    // business_trip
    destination: "",
    purpose: "",
    // regime
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

    // Build type-specific detail matching the backend Zod schemas exactly
    let detail: Record<string, unknown> = {}

    switch (selectedType) {
      case "leave":
        // Backend: { leaveType: LEAVE_TYPE_VALUES, regimeType: REGIME_TYPES }
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case "overtime":
        // Backend: { employeeShiftId: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case "late_early":
        // Backend: { employeeShiftId: cuid, durationMinutes: int(1-480), isLate: boolean }
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
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case "shift_swap":
        // Backend: { employeeShiftId: cuid, swapWithEmployeeId?: cuid, swapWithShiftId?: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca của bạn")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim()) detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case "work_from_home":
        // Backend: { location?: string }  ← key is "location" not "workLocation"
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case "business_trip":
        // Backend: { location: string(min2), purpose?: string, budget?: number }
        if (!form.destination.trim()) {
          toast.error("Vui lòng nhập địa điểm công tác")
          return
        }
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break

      case "regime":
        // Backend: { regimeType, reducedMinutesPerDay: int(0-480), applyToStart, applyToEnd, documentUrl? }
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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
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
              <p className="text-xs text-slate-400 mt-0.5">
                {step === "type"
                  ? "Chọn loại đơn bạn muốn gửi"
                  : "Điền thông tin chi tiết và xác nhận"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Step 1: Type picker */}
          {step === "type" && (
            <div className="p-5 grid grid-cols-2 gap-3">
              {Object.entries(APP_TYPE_META).map(([type, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type)
                      setStep("details")
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all active:scale-[0.98] ${m.border} ${m.bg}`}
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

          {/* Step 2: Details form */}
          {step === "details" && meta && (
            <form id="submit-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {/* Type badge */}
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
                <meta.icon size={16} className={meta.color} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* ── LEAVE ── */}
              {selectedType === "leave" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại nghỉ phép *</label>
                    <div className="relative">
                      <select
                        value={form.leaveType}
                        onChange={(e) => set("leaveType", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white pr-8"
                      >
                        {LEAVE_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["paid", "unpaid"] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => set("leaveRegimeType", rt)}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.leaveRegimeType === rt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
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
                    placeholder="Nhập CUID ca làm việc..."
                    value={form.employeeShiftId}
                    onChange={(e) => set("employeeShiftId", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => set("employeeShiftId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.isLate === v
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
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
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => set("employeeShiftId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Nhân viên muốn đổi (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="CUID nhân viên..."
                      value={form.swapWithEmployeeId}
                      onChange={(e) => set("swapWithEmployeeId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Ca muốn đổi sang (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="CUID ca làm việc..."
                      value={form.swapWithShiftId}
                      onChange={(e) => set("swapWithShiftId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── WFH ── */}
              {selectedType === "work_from_home" && (
                <div className="flex flex-col gap-1.5">
                  {/* Backend field name: "location" */}
                  <label className="text-xs font-semibold text-slate-600">Địa điểm làm việc</label>
                  <input
                    type="text"
                    placeholder="VD: Tại nhà, Quán cà phê..."
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {/* ── BUSINESS TRIP ── */}
              {selectedType === "business_trip" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    {/* Backend field name: "location" */}
                    <label className="text-xs font-semibold text-slate-600">Địa điểm công tác *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Hà Nội, TP.HCM..."
                      value={form.destination}
                      onChange={(e) => set("destination", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Mục đích chuyến đi</label>
                    <input
                      type="text"
                      placeholder="Mô tả mục đích..."
                      value={form.purpose}
                      onChange={(e) => set("purpose", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.regimeType === rt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {rt === "paid" ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Số phút giảm/ngày (0–480) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={480}
                      value={form.reducedMinutesPerDay}
                      onChange={(e) => set("reducedMinutesPerDay", Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">Áp dụng</label>
                    <div className="flex gap-4">
                      {(
                        [
                          { key: "applyToStart", label: "Đầu buổi" },
                          { key: "applyToEnd", label: "Cuối buổi" },
                        ] as const
                      ).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) => set(key, e.target.checked)}
                            className="accent-primary"
                          />
                          <span className="text-sm text-slate-600">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      URL chứng từ (tùy chọn)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.documentUrl}
                      onChange={(e) => set("documentUrl", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Lý do{" "}
                  <span className="text-slate-400 font-normal">(tối thiểu 5 ký tự nếu điền)</span>
                </label>
                <textarea
                  rows={3}
                  minLength={5}
                  placeholder="Nhập lý do gửi đơn..."
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Thông tin bổ sung (nếu có)..."
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="border-t border-slate-100 px-5 py-4 flex gap-3 bg-slate-50">
            <button
              type="button"
              onClick={() => setStep("type")}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Quay lại
            </button>
            <button
              type="submit"
              form="submit-form"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Gửi đơn
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cancel Confirm Dialog ────────────────────────────────────────────────────

interface CancelDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
}

function CancelDialog({ app, onCancel, onConfirm, isLoading }: CancelDialogProps) {
  const typeMeta = APP_TYPE_META[app.type]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Xác nhận hủy đơn?</h3>
          <p className="text-sm text-slate-500">
            Hủy đơn{" "}
            <strong className={typeMeta?.color}>{typeMeta?.label ?? app.type}</strong> từ{" "}
            {new Date(app.startDate).toLocaleDateString("vi-VN")}?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-colors"
          >
            {isLoading ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Application Card ─────────────────────────────────────────────────────────

interface ApplicationCardProps {
  app: IApplication
  mode: "mine" | "manage"
  onCancelRequest?: (app: IApplication) => void
  onApproveRequest?: (app: IApplication) => void
  onRejectRequest?: (app: IApplication) => void
  processingId?: string | null
}

function ApplicationCard({ app, mode, onCancelRequest, onApproveRequest, onRejectRequest, processingId }: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const typeMeta = APP_TYPE_META[app.type] ?? {
    label: app.type,
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  }
  const statusMeta = STATUS_META[app.status] ?? STATUS_META.pending
  const TypeIcon = typeMeta.icon
  const StatusIcon = statusMeta.icon

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${typeMeta.bg} ${typeMeta.border} ${typeMeta.color}`}
        >
          <TypeIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{typeMeta.label}</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.color} ${statusMeta.bg} ${statusMeta.border}`}
            >
              <StatusIcon size={10} />
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(app.startDate).toLocaleDateString("vi-VN")}
            {app.endDate && app.endDate !== app.startDate && (
              <> → {new Date(app.endDate).toLocaleDateString("vi-VN")}</>
            )}
            <span className="mx-1.5">·</span>
            Tạo: {new Date(app.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2 text-xs">
            {app.reason && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Lý do</span>
                <span className="text-slate-700">{app.reason}</span>
              </div>
            )}
            {app.note && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Ghi chú</span>
                <span className="text-slate-700">{app.note}</span>
              </div>
            )}
            {mode === "manage" && app.employee && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Nhân viên</span>
                <span className="text-slate-700 font-semibold">{app.employee.fullName}</span>
              </div>
            )}
            {app.rejectReason && (
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-red-50 border border-red-100">
                <span className="text-red-500 font-semibold">Lý do từ chối</span>
                <span className="text-red-700">{app.rejectReason}</span>
              </div>
            )}
            {app.processor && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Người duyệt</span>
                <span className="text-slate-700">{app.processor.fullName}</span>
              </div>
            )}
          </div>

          {app.status === APPLICATION_STATUS.PENDING && mode === "mine" && onCancelRequest && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCancelRequest(app)
              }}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors"
            >
              <X size={12} />
              Hủy đơn
            </button>
          )}

          {app.status === APPLICATION_STATUS.PENDING && mode === "manage" && onApproveRequest && onRejectRequest && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onApproveRequest(app)
                }}
                disabled={processingId === app.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                Phê duyệt
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRejectRequest(app)
                }}
                disabled={processingId === app.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={14} />
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Reject Confirm Dialog ────────────────────────────────────────────────────

interface RejectDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}

function RejectDialog({ app, onCancel, onConfirm, isLoading }: RejectDialogProps) {
  const [reason, setReason] = useState("")
  const typeMeta = APP_TYPE_META[app.type]

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
          <p className="text-sm text-slate-500">
            Từ chối đơn <strong className={typeMeta?.color}>{typeMeta?.label ?? app.type}</strong> của{" "}
            <strong>{app.employee?.fullName}</strong>?
          </p>
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
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-colors"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ApplicationSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3.5 bg-slate-100 rounded w-32" />
          <div className="h-3 bg-slate-100 rounded w-48" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
] as const

export default function Applications() {
  const { user } = useAuthStore()
  const isManager = user && ["admin", "hr_manager", "general_manager", "team_leader"].includes(user.role)
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
          { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: Hourglass },
          { label: "Đã duyệt", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: FileCheck2 },
          { label: "Từ chối", value: stats.rejected, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: FileX2 },
          { label: "Đã hủy", value: stats.cancelled, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", icon: X },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${stat.bg} ${stat.border}`}>
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
              onClick={() => { setStatusFilter(tab.value as typeof statusFilter); setPage(1) }}
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
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 bg-white focus:outline-none appearance-none"
          >
            <option value="all">Tất cả loại đơn</option>
            {Object.entries(APP_TYPE_META).map(([type, m]) => (
              <option key={type} value={type}>{m.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
