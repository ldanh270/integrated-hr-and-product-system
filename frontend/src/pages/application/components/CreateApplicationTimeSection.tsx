"use client"

import { LEAVE_TYPE_OPTIONS, REGIME_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { IWorkingShift } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"
import type { ApplicationFormState } from "../hooks/useCreateApplicationForm"

import { Plus } from "lucide-react"

interface Props {
  type: string
  form: ApplicationFormState
  set: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  shifts: IWorkingShift[]
  employees: Employee[]
}

export function CreateApplicationTimeSection({ type, form, set, shifts, employees }: Props) {
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  return (
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
  )
}
