"use client"

import { ApplicationDetail } from "@/components/features/application/ApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { APPLICATION_TYPES, LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import type { IApplication } from "@/lib/api/application.api"

import { useEffect, useState } from "react"

import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Laptop,
  Plus,
  Repeat2,
  Send,
  Stethoscope,
  X,
} from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
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
  [APPLICATION_TYPES.LEAVE.LABEL]: {
    label: "Nghỉ phép",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    hint: "Xin nghỉ phép năm, thai sản, ốm...",
  },
  [APPLICATION_TYPES.OVERTIME.LABEL]: {
    label: "Làm thêm giờ",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hint: "Đăng ký làm thêm giờ ngoài ca",
  },
  [APPLICATION_TYPES.WORK_FROM_HOME.LABEL]: {
    label: "WFH",
    icon: Laptop,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    hint: "Làm việc từ xa / tại nhà",
  },
  [APPLICATION_TYPES.SHIFT_SWAP.LABEL]: {
    label: "Đổi ca",
    icon: Repeat2,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    hint: "Đề xuất đổi ca với đồng nghiệp",
  },
  [APPLICATION_TYPES.BUSINESS_TRIP.LABEL]: {
    label: "Công tác",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    hint: "Đi công tác theo yêu cầu",
  },
  [APPLICATION_TYPES.LATE_EARLY.LABEL]: {
    label: "Đi muộn/Về sớm",
    icon: CalendarClock,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    hint: "Thông báo đi muộn hoặc về sớm",
  },
  [APPLICATION_TYPES.REGIME.LABEL]: {
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
  initialType?: string
}

/** Correct leave type values matching backend LEAVE_TYPE_VALUES enum */
const LEAVE_TYPE_OPTIONS = [
  { value: LEAVE_TYPE.ANNUAL_LEAVE, label: "Nghỉ phép năm" },
  { value: LEAVE_TYPE.SICK_LEAVE, label: "Nghỉ ốm" },
  { value: LEAVE_TYPE.MATERNITY_LEAVE, label: "Thai sản" },
  { value: LEAVE_TYPE.BEREAVEMENT_LEAVE, label: "Nghỉ tang" },
  { value: LEAVE_TYPE.MARRIAGE_LEAVE, label: "Nghỉ cưới" },
  { value: LEAVE_TYPE.UNPAID_LEAVE, label: "Nghỉ không lương" },
  { value: LEAVE_TYPE.OTHER, label: "Khác" },
] as const

function SubmitApplicationModal({ onClose, onSuccess, initialType }: SubmitModalProps) {
  const navigate = useNavigate()
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [step, setStep] = useState<"type" | "details">(initialType ? "details" : "type")
  const [selectedType] = useState<string>(initialType || "")
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    // leave
    leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
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
    regimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
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
      case APPLICATION_TYPES.LEAVE.LABEL:
        // Backend: { leaveType: LEAVE_TYPE_VALUES, regimeType: REGIME_TYPES }
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        // Backend: { employeeShiftId: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
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

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        // Backend: { employeeShiftId: cuid, swapWithEmployeeId?: cuid, swapWithShiftId?: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca của bạn")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim())
          detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        // Backend: { location?: string }  ← key is "location" not "workLocation"
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case APPLICATION_TYPES.BUSINESS_TRIP.LABEL:
        // Backend: { location: string(min2), purpose?: string, budget?: number }
        if (!form.destination.trim()) {
          toast.error("Vui lòng nhập địa điểm công tác")
          return
        }
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break

      case APPLICATION_TYPES.REGIME.LABEL:
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
      <div
        className={`bg-background w-full ${step === "type" ? "max-w-3xl" : "max-w-lg"} rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
      >
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
                {step === "type" ? "Tạo mới đơn từ" : `Tạo đơn ${meta?.label}`}
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
            <div className="p-6 grid grid-cols-2 gap-4">
              {Object.entries(APP_TYPE_META).map(([type, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/application/create?type=${type}`)
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 text-left hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] bg-background"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${m.color} ${m.bg}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-700">{m.label}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{m.hint}</p>
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
              <div
                className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}
              >
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
              {selectedType === APPLICATION_TYPES.LEAVE.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại nghỉ phép *</label>
                    <div className="relative">
                      <select
                        value={form.leaveType}
                        onChange={(e) => set("leaveType", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background pr-8"
                      >
                        {LEAVE_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={13}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([REGIME_TYPE.PAID, REGIME_TYPE.UNPAID] as const).map((rt) => (
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
                          {rt === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── OVERTIME ── */}
              {selectedType === APPLICATION_TYPES.OVERTIME.LABEL && (
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
              {selectedType === APPLICATION_TYPES.LATE_EARLY.LABEL && (
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
                    <label className="text-xs font-semibold text-slate-600">
                      Số phút (1–480) *
                    </label>
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
              {selectedType === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
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
                    <label className="text-xs font-semibold text-slate-600">
                      ID Nhân viên muốn đổi (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="CUID nhân viên..."
                      value={form.swapWithEmployeeId}
                      onChange={(e) => set("swapWithEmployeeId", e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      ID Ca muốn đổi sang (tùy chọn)
                    </label>
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
              {selectedType === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
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
              {selectedType === APPLICATION_TYPES.BUSINESS_TRIP.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    {/* Backend field name: "location" */}
                    <label className="text-xs font-semibold text-slate-600">
                      Địa điểm công tác *
                    </label>
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
                    <label className="text-xs font-semibold text-slate-600">
                      Mục đích chuyến đi
                    </label>
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
              {selectedType === APPLICATION_TYPES.REGIME.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([REGIME_TYPE.PAID, REGIME_TYPE.UNPAID] as const).map((rt) => (
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
                          {rt === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
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
      <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Xác nhận hủy đơn?</h3>
          <p className="text-sm text-slate-500">
            Hủy đơn <strong className={typeMeta?.color}>{typeMeta?.label ?? app.type}</strong> từ{" "}
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
      <div className="bg-background w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-1">
            <X size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Từ chối đơn?</h3>
          <p className="text-sm text-slate-500">
            Từ chối đơn <strong className={typeMeta?.color}>{typeMeta?.label ?? app.type}</strong>{" "}
            của <strong>{app.employee?.fullName}</strong>?
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationDashboard() {
  // View State: "list" | "detail"
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)

  const [searchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") as "mine" | "manage") || "mine"
  const activeType = searchParams.get("type") || "all"

  const myApps = useMyApplications()
  const manageApps = useManageApplications()

  useEffect(() => {
    setView("list")
    setSelectedApp(null)
    myApps.setTypeFilter(activeType)
    manageApps.setTypeFilter(activeType)
  }, [activeTab, activeType, myApps.setTypeFilter, manageApps.setTypeFilter])

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [createType, setCreateType] = useState<string | undefined>(undefined)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
    if (view === "detail" && selectedApp?.id === cancelTarget.id) setView("list")
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
    if (view === "detail" && selectedApp?.id === rejectTarget.id) {
      setView("list")
    }
  }

  const handleApproveFromDetail = async (app: IApplication) => {
    await manageApps.handleApprove(app.id)
    setView("list")
  }

  const handleRowClick = (app: IApplication) => {
    setSelectedApp(app)
    setView("detail")
  }

  if (view === "detail") {
    return (
      <ApplicationDetail
        application={selectedApp}
        isLoading={activeTab === "mine" ? myApps.isLoading : manageApps.isLoading}
        mode={activeTab}
        onBack={() => setView("list")}
        onApprove={handleApproveFromDetail}
        onReject={setRejectTarget}
      />
    )
  }

  const currentTypeConfig = Object.values(APPLICATION_TYPES).find((t) => t.LABEL === activeType)

  return (
    <div className="flex flex-col gap-6 p-6 w-full mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-background rounded-xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setCreateType(undefined)
                    setShowSubmitModal(true)
                    setShowCreateMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-[14px] text-foreground hover:bg-muted hover:text-primary transition-colors"
                >
                  Tạo mới đơn từ
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center text-[15px]">
            <span className="font-semibold text-foreground">Đơn thư</span>
            <ChevronRight className="mx-2 text-muted-foreground/70" size={16} />
            {searchParams.get("tab") === "manage" ? (
              <span className="text-muted-foreground font-medium">Bạn duyệt</span>
            ) : searchParams.get("tab") === "mine" ? (
              <span className="text-muted-foreground font-medium">Của bạn</span>
            ) : (
              <>
                <span className="text-muted-foreground font-medium">Danh sách đơn thư</span>
                {currentTypeConfig && (
                  <>
                    <ChevronRight className="mx-2 text-muted-foreground/70" size={16} />
                    <span className="text-primary font-medium">
                      {currentTypeConfig.DESCRIPTION}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-4 min-w-0 bg-background border border-border rounded-xl px-6 pb-6 shadow-sm">
        <ApplicationList
          mode={activeTab}
          onRowClick={handleRowClick}
          hookState={activeTab === "mine" ? myApps : manageApps}
        />
      </div>

      {/* Modals */}
      {showSubmitModal && (
        <SubmitApplicationModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => myApps.refetch()}
          initialType={createType}
        />
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
