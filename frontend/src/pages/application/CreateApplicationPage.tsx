"use client"

import { LEAVE_TYPE_OPTIONS, REGIME_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import {
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
  LEAVE_TYPE,
  REGIME_TYPE,
} from "@/config/entities/attendance.config"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { shiftsApi } from "@/lib/api/attendance.api"
import { type IApprover, employeeApi } from "@/lib/api/employee.api"
import { useAuthStore } from "@/store/auth-store"
import type { IWorkingShift } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState } from "react"

import { ChevronRight, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

export default function CreateApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get("type") || "leave"

  const { user } = useAuthStore()
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const typeLabel = Object.entries(APPLICATION_TYPE_LABELS).find(([k]) => k === type)?.[1] || "đơn từ"

  const handleBack = () => {
    navigate(-1)
  }

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    assignedToId: "",
    // leave
    leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    // overtime / late_early / shift_swap
    employeeShiftId: "",
    overtimeHours: 0,
    // late_early specific
    durationMinutes: 30,
    isLate: true,
    // shift_swap
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    swapWithDate: "",
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

  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [shifts, setShifts] = useState<IWorkingShift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    employeeApi
      .getApprovers()
      .then(setApprovers)
      .catch(() => {})
    shiftsApi
      .getAll()
      .then(setShifts)
      .catch(() => {})
    employeeApi
      .list({ limit: 1000 })
      .then((res) => { setEmployees(res.data); })
      .catch(() => {})
  }, [])

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async () => {
    if (!form.startDate) return

    let detail: Record<string, unknown> = {}

    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim())
          detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case APPLICATION_TYPES.BUSINESS_TRIP.LABEL:
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break

      case APPLICATION_TYPES.REGIME.LABEL:
        detail = {
          regimeType: form.regimeType,
          reducedMinutesPerDay: form.reducedMinutesPerDay,
          applyToStart: form.applyToStart,
          applyToEnd: form.applyToEnd,
        }
        if (form.documentUrl.trim()) detail.documentUrl = form.documentUrl.trim()
        break

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        detail = {}
        break
    }

    const success = await submitApplication({
      type,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      assignedToId:
        form.assignedToId && form.assignedToId !== "none" ? form.assignedToId : undefined,
      detail,
    })

    if (success) {
      navigate(-1)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background w-full animate-in fade-in duration-300 overflow-hidden">
      {/* Header Breadcrumbs */}
      <div className="flex items-center px-6 py-4 bg-background border-b border-border shadow-sm z-10 shrink-0">
        <button
          onClick={handleBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors mr-3"
        >
          <Plus size={16} strokeWidth={2.5} className="rotate-45" /> {/* Close/Back icon */}
        </button>
        <span className="text-[15px] font-semibold text-foreground">Đơn thư</span>
        <ChevronRight size={16} className="text-muted-foreground/70 mx-2" />
        <span className="text-[15px] text-muted-foreground">Tạo mới {typeLabel.toLowerCase()}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        {/* Section 1: Thông tin đơn */}
        <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm text-foreground">Thông tin đơn</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nhân sự <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                value={`${user?.fullName || "Người dùng"} - ${user?.email || ""}`}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Người duyệt</label>
              <select
                value={form.assignedToId}
                onChange={(e) => { set("assignedToId", e.target.value); }}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Không chỉ định (bất kỳ ai có thẩm quyền) --</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName}
                    {a.position ? ` — ${a.position}` : ""} ({a.role.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            {type === APPLICATION_TYPES.RESIGNATION.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Ngày thôi việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => { set("startDate", e.target.value); }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Lý do<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập lý do hoặc ghi chú chi tiết"
                    value={form.reason}
                    onChange={(e) => { set("reason", e.target.value); }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Thời gian */}
        {type !== APPLICATION_TYPES.RESIGNATION.LABEL && (
          <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-sm text-foreground">Thời gian</h3>
            </div>
            <div className="p-5">
              {type === APPLICATION_TYPES.LEAVE.LABEL ? (
                <>
                  <p className="text-sm text-foreground mb-4">
                    Số phép còn lại: <span className="font-semibold text-red-600">0</span> ngày phép
                  </p>

                  <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted border-b border-border text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium flex items-center gap-2">
                            <button className="h-4 w-4 rounded-full border border-muted-foreground/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary">
                              <Plus size={10} />
                            </button>
                            Kiểu nghỉ <span className="text-red-500">*</span>
                          </th>
                          <th className="px-4 py-3 font-medium">Thời gian</th>
                          <th className="px-4 py-3 font-medium">Dùng phép</th>
                          <th className="px-4 py-3 font-medium">Lý do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        <tr>
                          <td className="px-4 py-3">
                            <select
                              value={form.leaveType}
                              onChange={(e) => { set("leaveType", e.target.value); }}
                              className="w-full h-8 px-2 text-sm border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {LEAVE_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 flex gap-2 items-center">
                            <input
                              type="date"
                              value={form.startDate}
                              onChange={(e) => { set("startDate", e.target.value); }}
                              className="w-36 h-8 px-2 text-sm border border-input bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-muted-foreground/70">-</span>
                            <input
                              type="date"
                              value={form.endDate}
                              onChange={(e) => { set("endDate", e.target.value); }}
                              className="w-36 h-8 px-2 text-sm border border-input bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={form.leaveRegimeType}
                              onChange={(e) => {
                                set("leaveRegimeType", e.target.value as "paid" | "unpaid");
                              }}
                              className="w-36 h-8 px-2 text-sm border border-input bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {REGIME_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Nhập lý do"
                              value={form.reason}
                              onChange={(e) => { set("reason", e.target.value); }}
                              className="w-full h-8 px-2 text-sm border border-input bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* Common fields for other types */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {type === APPLICATION_TYPES.OVERTIME.LABEL
                        ? "Ngày tăng ca"
                        : type === APPLICATION_TYPES.SHIFT_SWAP.LABEL
                          ? "Ngày ca của bạn"
                          : type === APPLICATION_TYPES.LATE_EARLY.LABEL
                            ? "Ngày làm việc"
                            : type === APPLICATION_TYPES.RESIGNATION.LABEL
                              ? "Ngày thôi việc"
                              : "Ngày bắt đầu"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => { set("startDate", e.target.value); }}
                      className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {!(
                    [
                      APPLICATION_TYPES.OVERTIME.LABEL,
                      APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                      APPLICATION_TYPES.LATE_EARLY.LABEL,
                      APPLICATION_TYPES.RESIGNATION.LABEL,
                    ] as string[]
                  ).includes(type) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => { set("endDate", e.target.value); }}
                        className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Specific fields */}
                  {(
                    [
                      APPLICATION_TYPES.OVERTIME.LABEL,
                      APPLICATION_TYPES.LATE_EARLY.LABEL,
                      APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                    ] as string[]
                  ).includes(type) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL ? "Ca của bạn" : "Ca làm việc"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.employeeShiftId}
                        onChange={(e) => { set("employeeShiftId", e.target.value); }}
                        className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn ca làm việc --</option>
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {type === APPLICATION_TYPES.OVERTIME.LABEL && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Số giờ tăng ca <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={form.overtimeHours || ""}
                        onChange={(e) => { set("overtimeHours", parseFloat(e.target.value)); }}
                        placeholder="Nhập số giờ"
                        className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {type === APPLICATION_TYPES.LATE_EARLY.LABEL && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Số phút <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="480"
                          value={form.durationMinutes}
                          onChange={(e) => { set("durationMinutes", parseInt(e.target.value)); }}
                          className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Loại <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.isLate ? "true" : "false"}
                          onChange={(e) => { set("isLate", e.target.value === "true"); }}
                          className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="true">Đi muộn</option>
                          <option value="false">Về sớm</option>
                        </select>
                      </div>
                    </>
                  )}

                  {type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Kiểu làm việc <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.location}
                        onChange={(e) => { set("location", e.target.value); }}
                        className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Chọn</option>
                        <option value="Làm 1 ngày">Làm 1 ngày</option>
                        <option value="Làm buổi sáng">Làm buổi sáng</option>
                        <option value="Làm buổi chiều">Làm buổi chiều</option>
                        <option value="Làm nhiều ngày">Làm nhiều ngày</option>
                      </select>
                    </div>
                  )}

                  {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Ngày ca của đồng nghiệp
                        </label>
                        <input
                          type="date"
                          value={form.swapWithDate}
                          onChange={(e) => { set("swapWithDate", e.target.value); }}
                          className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Ca của đồng nghiệp
                        </label>
                        <select
                          value={form.swapWithShiftId}
                          onChange={(e) => { set("swapWithShiftId", e.target.value); }}
                          className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Chọn ca làm việc --</option>
                          {shifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Nhân sự đổi ca
                        </label>
                        <select
                          value={form.swapWithEmployeeId}
                          onChange={(e) => { set("swapWithEmployeeId", e.target.value); }}
                          className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Chọn nhân sự --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-foreground">Lý do/Ghi chú</label>
                    <textarea
                      rows={2}
                      placeholder="Nhập lý do hoặc ghi chú chi tiết"
                      value={form.reason}
                      onChange={(e) => { set("reason", e.target.value); }}
                      className="w-full p-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-md border border-input text-foreground font-medium hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
              onClick={(e) => { e.preventDefault(); void handleSubmit(); }}
            disabled={isSubmitting || !form.startDate}
            className="px-6 py-2 rounded-md bg-primary text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đơn"}
          </button>
        </div>
      </div>
    </div>
  )
}
