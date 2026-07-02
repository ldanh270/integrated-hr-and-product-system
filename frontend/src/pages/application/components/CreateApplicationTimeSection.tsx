"use client"

import { LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { IEmployeeShiftAssignment } from "@/types/attendance.types"
import type { Employee } from "@/types/employee.types"
import type { ApplicationFormState } from "../hooks/useCreateApplicationForm"
import { useShifts } from "@/hooks/attendance/use-shifts"



import dayjs from "dayjs"

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = "image/jpeg, image/png, image/webp, image/gif, application/pdf";

interface Props {
  type: string
  form: ApplicationFormState
  set: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  myEmployeeShift: IEmployeeShiftAssignment | null
  partnerEmployeeShift: IEmployeeShiftAssignment | null
  employees: Employee[]
}

export function CreateApplicationTimeSection({ type, form, set, myEmployeeShift, partnerEmployeeShift, employees }: Props) {
  const { data: shifts = [] } = useShifts()

  const todayStr = dayjs().format("YYYY-MM-DD")

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const formatShiftLabel = (shift: IEmployeeShiftAssignment["shift"] | undefined) =>
    shift ? `${shift.name} (${formatTime(shift.startTime)} - ${formatTime(shift.endTime)})` : null

  return (
    <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/50">
        <h3 className="font-semibold text-sm text-foreground">Thời gian</h3>
      </div>
      <div className="p-5">
        {type === APPLICATION_TYPES.LEAVE.LABEL ? (
          <>


            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium text-left w-1/4">
                      Kiểu nghỉ <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 font-medium text-left whitespace-nowrap">Thời gian</th>
                    <th className="px-4 py-3 font-medium text-left w-full">Lý do</th>
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
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col">
                          <input
                            type="date"
                            min={todayStr}
                            value={form.startDate}
                            onChange={(e) => { set("startDate", e.target.value); }}
                            className={`w-36 h-8 px-2 text-sm border bg-transparent rounded focus:outline-none focus:ring-1 ${form.startDate && form.startDate < todayStr ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-primary'}`}
                          />
                          {form.startDate && form.startDate < todayStr && <span className="text-[10px] text-red-500 mt-0.5">Không được chọn ngày quá khứ</span>}
                        </div>
                        <span className="text-muted-foreground/70 mt-1.5">-</span>
                        <div className="flex flex-col">
                          <input
                            type="date"
                            min={form.startDate || todayStr}
                            value={form.endDate}
                            onChange={(e) => { set("endDate", e.target.value); }}
                            className={`w-36 h-8 px-2 text-sm border bg-transparent rounded focus:outline-none focus:ring-1 ${(form.endDate && form.endDate < todayStr) || (form.endDate && form.startDate && form.endDate < form.startDate) ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-primary'}`}
                          />
                          {form.endDate && form.endDate < todayStr ? (
                            <span className="text-[10px] text-red-500 mt-0.5">Không được chọn ngày quá khứ</span>
                          ) : form.endDate && form.startDate && form.endDate < form.startDate ? (
                            <span className="text-[10px] text-red-500 mt-0.5">Phải sau ngày bắt đầu</span>
                          ) : null}
                        </div>
                      </div>
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

            <div className="mt-4">
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Chứng từ đính kèm (Hỗ trợ định dạng: JPEG, PNG, WEBP, GIF, PDF. Tối đa {MAX_FILE_SIZE_MB}MB)
              </label>
              <input
                type="file"
                accept={ALLOWED_MIME_TYPES}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  set("attachmentFile", file as any)
                }}
                className="w-full text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {form.attachmentFile && (
                <p className="mt-2 text-xs text-muted-foreground">Đã chọn: {form.attachmentFile.name}</p>
              )}
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
                min={todayStr}
                value={form.startDate}
                onChange={(e) => { set("startDate", e.target.value); }}
                className={`w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 ${form.startDate && form.startDate < todayStr ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-primary'}`}
              />
              {form.startDate && form.startDate < todayStr && <p className="text-xs text-red-500 mt-1">Không được chọn ngày trong quá khứ</p>}
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
                  min={form.startDate || todayStr}
                  value={form.endDate}
                  onChange={(e) => { set("endDate", e.target.value); }}
                  className={`w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 ${(form.endDate && form.endDate < todayStr) || (form.endDate && form.startDate && form.endDate < form.startDate) ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-primary'}`}
                />
                {form.endDate && form.endDate < todayStr ? (
                  <p className="text-xs text-red-500 mt-1">Không được chọn ngày trong quá khứ</p>
                ) : form.endDate && form.startDate && form.endDate < form.startDate ? (
                  <p className="text-xs text-red-500 mt-1">Ngày kết thúc phải từ ngày bắt đầu trở đi</p>
                ) : null}
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
                  value={form.employeeShiftId || ""}
                  onChange={(e) => { set("employeeShiftId", e.target.value); }}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                  disabled={!myEmployeeShift}
                >
                  {!myEmployeeShift ? (
                    <option value="">
                      {form.startDate ? "Không có ca nào được xếp cho ngày này" : "Chọn ngày để xem ca"}
                    </option>
                  ) : (
                    <option value="">Chọn ca làm việc</option>
                  )}
                  {myEmployeeShift && (
                    <option value={myEmployeeShift.id}>
                      {formatShiftLabel(myEmployeeShift.shift)}
                    </option>
                  )}
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
                  Ca làm việc <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => { set("location", e.target.value); }}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Chọn ca làm việc</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.name}>
                      {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                    </option>
                  ))}
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
                    min={todayStr}
                    value={form.swapWithDate}
                    onChange={(e) => { set("swapWithDate", e.target.value); }}
                    className={`w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 ${form.swapWithDate && form.swapWithDate < todayStr ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-primary'}`}
                  />
                  {form.swapWithDate && form.swapWithDate < todayStr && <p className="text-xs text-red-500 mt-1">Không được chọn ngày trong quá khứ</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Ca của đồng nghiệp
                  </label>
                  {partnerEmployeeShift ? (
                    <div className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted text-foreground flex items-center">
                      {formatShiftLabel(partnerEmployeeShift.shift)}
                    </div>
                  ) : (
                    <div className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted text-muted-foreground flex items-center italic">
                      {form.swapWithEmployeeId && form.swapWithDate
                        ? "Không có ca nào được xếp cho ngày này"
                        : "Chọn nhân sự và ngày để xem ca"}
                    </div>
                  )}
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
