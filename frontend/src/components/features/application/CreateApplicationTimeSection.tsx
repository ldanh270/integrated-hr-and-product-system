"use client"

import { LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { AddRegimeCategoryDialog } from "@/components/features/application/add-regime-category-dialog"
import { FileUploader } from "@/components/ui/file-uploader"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { ApplicationFormState } from "@/hooks/application/useCreateApplicationForm"
import { useRegimeCategories } from "@/hooks/attendance/use-regime-categories"
import { schedulesApi } from "@/lib/api/attendance.api"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState } from "react"

import { Trash2 } from "lucide-react"

interface Props {
  type: string
  form: ApplicationFormState
  set: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  employees: Employee[]
  formIndex?: number
  onRemove?: () => void
}

interface IEmployeeShiftOption {
  id: string
  name?: string
  startTime?: number
  endTime?: number
  shift?: {
    name: string
    startTime: number
    endTime: number
  }
}

/** Renders type-specific scheduling and evidence fields for an application item. */
export function CreateApplicationTimeSection({
  type,
  form,
  set,
  employees,
  formIndex,
  onRemove,
}: Props) {
  const [shifts, setShifts] = useState<IEmployeeShiftOption[]>([])
  const [partnerShifts, setPartnerShifts] = useState<IEmployeeShiftOption[]>([])
  const [isAddRegimeOpen, setIsAddRegimeOpen] = useState(false)

  const { categories } = useRegimeCategories()
  useEffect(() => {
    let active = true
    if (
      form.startDate &&
      (
        [
          APPLICATION_TYPES.OVERTIME.LABEL,
          APPLICATION_TYPES.LATE_EARLY.LABEL,
          APPLICATION_TYPES.SHIFT_SWAP.LABEL,
          APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
          APPLICATION_TYPES.FORGOT_CARD.LABEL,
        ] as string[]
      ).includes(type)
    ) {
      schedulesApi
        .getMyShifts(form.startDate, form.startDate)
        .then((data) => {
          if (active) setShifts(data)
        })
        .catch(() => {
          if (active) setShifts([])
        })
    } else {
      void Promise.resolve().then(() => {
        if (active) setShifts([])
      })
    }
    return () => {
      active = false
    }
  }, [type, form.startDate])

  useEffect(() => {
    let active = true
    if (
      type === APPLICATION_TYPES.SHIFT_SWAP.LABEL &&
      form.swapWithEmployeeId &&
      form.swapWithDate
    ) {
      schedulesApi
        .getShiftsByEmployee(form.swapWithEmployeeId, form.swapWithDate, form.swapWithDate)
        .then((data) => {
          if (active) setPartnerShifts(data)
        })
        .catch(() => {
          if (active) setPartnerShifts([])
        })
    } else {
      void Promise.resolve().then(() => {
        if (active) setPartnerShifts([])
      })
    }
    return () => {
      active = false
    }
  }, [type, form.swapWithEmployeeId, form.swapWithDate])

  /** Formats a minute offset from midnight as an HH:mm value. */
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  // Validations
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDateObj = form.startDate ? new Date(form.startDate) : null
  const endDateObj = form.endDate ? new Date(form.endDate) : null

  const isStartDatePast = startDateObj ? startDateObj < today : false
  const isStartDateFuture = startDateObj ? startDateObj > today : false
  const isEndDateBeforeStart = startDateObj && endDateObj ? endDateObj < startDateObj : false

  const isForgotCard = type === APPLICATION_TYPES.FORGOT_CARD.LABEL
  const showDatePastError = !isForgotCard && isStartDatePast
  const showDateFutureError = isForgotCard && isStartDateFuture

  return (
    <div className="bg-background rounded-lg border border-border shadow-sm overflow-visible shrink-0 relative flex flex-col">
      <div className="px-5 py-4 border-b border-border bg-muted/50 rounded-t-lg flex items-center gap-3">
        {formIndex !== undefined && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {formIndex + 1}
          </div>
        )}
        <h3 className="font-semibold text-[15px] text-foreground flex-1">
          {type === APPLICATION_TYPES.LEAVE.LABEL && "Nghỉ phép"}
          {type === APPLICATION_TYPES.OVERTIME.LABEL && "Tăng ca"}
          {type === APPLICATION_TYPES.LATE_EARLY.LABEL && "Đi muộn / Về sớm"}
          {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && "Đổi ca"}
          {type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && "Làm việc từ xa"}
          {!(
            [
              APPLICATION_TYPES.LEAVE.LABEL,
              APPLICATION_TYPES.OVERTIME.LABEL,
              APPLICATION_TYPES.LATE_EARLY.LABEL,
              APPLICATION_TYPES.SHIFT_SWAP.LABEL,
              APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
            ] as string[]
          ).includes(type) && "Thời gian"}
        </h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-destructive text-sm flex items-center gap-1.5 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            <Trash2 size={15} /> Xóa
          </button>
        )}
      </div>
      <div className="p-5">
        {type === APPLICATION_TYPES.LEAVE.LABEL ? (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-sm text-foreground mb-3">Thời gian</h4>
              <div className="border border-border rounded-md overflow-hidden bg-background">
                <div className="grid grid-cols-[200px_350px_1fr] bg-muted/30 border-b border-border">
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Kiểu nghỉ
                  </div>
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Thời gian
                  </div>
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Lý do
                  </div>
                </div>
                <div className="grid grid-cols-[200px_350px_1fr]">
                  <div className="p-3 border-r border-border">
                    <select
                      value={form.leaveType}
                      onChange={(e) => {
                        set("leaveType", e.target.value)
                      }}
                      className="w-full h-9 px-3 text-[13px] border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {LEAVE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 border-r border-border flex flex-col gap-1 justify-center">
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => {
                          set("startDate", e.target.value)
                        }}
                        className={`w-[140px] h-9 px-2 text-[13px] border bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${isStartDatePast ? "border-destructive" : "border-input"}`}
                      />
                      <span className="text-muted-foreground/70">-</span>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => {
                          set("endDate", e.target.value)
                        }}
                        className={`w-[140px] h-9 px-2 text-[13px] border bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${isEndDateBeforeStart ? "border-destructive" : "border-input"}`}
                      />
                    </div>
                    {isStartDatePast && (
                      <span className="text-[11px] text-destructive">
                        Thời gian không được ở quá khứ
                      </span>
                    )}
                    {isEndDateBeforeStart && (
                      <span className="text-[11px] text-destructive">
                        Ngày kết thúc không được nhỏ hơn
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex items-center">
                    <input
                      type="text"
                      placeholder="Nhập lý do"
                      value={form.reason}
                      onChange={(e) => {
                        set("reason", e.target.value)
                      }}
                      className="w-full h-9 px-3 text-[13px] border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[13px] font-medium text-foreground mb-2 flex items-center gap-1">
                Chứng từ đính kèm
                <span className="text-muted-foreground font-normal">
                  (Hỗ trợ định dạng: JPEG, PNG, WEBP, GIF, PDF. Tối đa 10MB)
                </span>
              </label>
              <FileUploader
                onUploadSuccess={(url) => {
                  set("documentUrl", url)
                }}
              />
              {form.documentUrl && (
                <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-primary">
                  Đã tải lên tệp:{" "}
                  <a
                    href={form.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline transition-colors hover:text-primary/80"
                  >
                    Xem tài liệu
                  </a>
                </div>
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
                    : type === APPLICATION_TYPES.LATE_EARLY.LABEL ||
                        type === APPLICATION_TYPES.FORGOT_CARD.LABEL
                      ? "Ngày làm việc"
                      : type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL
                        ? "Ngày làm việc từ xa"
                        : type === APPLICATION_TYPES.RESIGNATION.LABEL
                          ? "Ngày thôi việc"
                          : type === APPLICATION_TYPES.REGIME.LABEL
                            ? "Ngày bắt đầu áp dụng"
                            : "Ngày bắt đầu"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  set("startDate", e.target.value)
                }}
                className={`w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${showDatePastError || showDateFutureError ? "border-destructive" : "border-input"}`}
              />
              {showDatePastError && (
                <span className="text-xs text-destructive">Thời gian không được ở quá khứ</span>
              )}
              {showDateFutureError && (
                <span className="text-xs text-destructive">Thời gian không được ở tương lai</span>
              )}
            </div>
            {!(
              [
                APPLICATION_TYPES.OVERTIME.LABEL,
                APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                APPLICATION_TYPES.LATE_EARLY.LABEL,
                APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
                APPLICATION_TYPES.RESIGNATION.LABEL,
                APPLICATION_TYPES.FORGOT_CARD.LABEL,
              ] as string[]
            ).includes(type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {type === APPLICATION_TYPES.REGIME.LABEL
                    ? "Ngày kết thúc chế độ"
                    : "Ngày kết thúc"}
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => {
                    set("endDate", e.target.value)
                  }}
                  className={`w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${isEndDateBeforeStart ? "border-destructive" : "border-input"}`}
                />
                {isEndDateBeforeStart && (
                  <span className="text-xs text-destructive">
                    Ngày kết thúc không được nhỏ hơn ngày bắt đầu
                  </span>
                )}
              </div>
            )}

            {/* Specific fields */}
            {(
              [
                APPLICATION_TYPES.OVERTIME.LABEL,
                APPLICATION_TYPES.LATE_EARLY.LABEL,
                APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
                APPLICATION_TYPES.FORGOT_CARD.LABEL,
              ] as string[]
            ).includes(type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL ? "Ca của bạn" : "Ca làm việc"}
                </label>
                <select
                  value={form.employeeShiftId}
                  onChange={(e) => {
                    set("employeeShiftId", e.target.value)
                  }}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn ca làm việc --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shift
                        ? `${s.shift.name} (${formatTime(s.shift.startTime)} - ${formatTime(s.shift.endTime)})`
                        : "Không xác định"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === APPLICATION_TYPES.OVERTIME.LABEL && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Số giờ tăng ca</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.overtimeHours || ""}
                  onChange={(e) => {
                    set("overtimeHours", parseFloat(e.target.value))
                  }}
                  placeholder="Nhập số giờ"
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {type === APPLICATION_TYPES.LATE_EARLY.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Số phút</label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={form.durationMinutes}
                    onChange={(e) => {
                      set("durationMinutes", parseInt(e.target.value))
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Loại</label>
                  <select
                    value={form.isLate ? "true" : "false"}
                    onChange={(e) => {
                      set("isLate", e.target.value === "true")
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="true">Đi muộn</option>
                    <option value="false">Về sớm</option>
                  </select>
                </div>
              </>
            )}

            {type === APPLICATION_TYPES.REGIME.LABEL && (
              <>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-foreground">Loại chế độ</label>
                  <div className="flex gap-2">
                    <select
                      value={form.regimeCategoryId}
                      onChange={(e) => {
                        const cat = categories.find((category) => category.id === e.target.value)
                        set("regimeCategoryId", e.target.value)
                        if (cat) {
                          set("regimeLateMinutes", cat.maxLateMinutes)
                          set("regimeEarlyMinutes", cat.maxEarlyMinutes)
                        }
                      }}
                      className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Chọn loại chế độ --</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRegimeOpen(true)
                      }}
                      className="h-9 px-3 text-sm font-medium border border-input rounded-md bg-muted/50 hover:bg-muted whitespace-nowrap transition-colors"
                    >
                      + Thêm mới
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Thời gian về muộn (phút)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={form.regimeLateMinutes}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Thời gian về sớm (phút)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={form.regimeEarlyMinutes}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <AddRegimeCategoryDialog
                  open={isAddRegimeOpen}
                  onOpenChange={setIsAddRegimeOpen}
                  onCreated={(category) => {
                    set("regimeCategoryId", category.id)
                    set("regimeLateMinutes", category.maxLateMinutes)
                    set("regimeEarlyMinutes", category.maxEarlyMinutes)
                  }}
                />
              </>
            )}

            {type === APPLICATION_TYPES.FORGOT_CARD.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Giờ vào</label>
                  <input
                    type="time"
                    value={form.checkInAt}
                    onChange={(e) => {
                      set("checkInAt", e.target.value)
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Giờ ra</label>
                  <input
                    type="time"
                    value={form.checkOutAt}
                    onChange={(e) => {
                      set("checkOutAt", e.target.value)
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-foreground">Chứng từ đính kèm</label>
                  <FileUploader
                    onUploadSuccess={(url) => {
                      set("documentUrl", url)
                    }}
                  />
                  {form.documentUrl && (
                    <div className="mt-1 text-xs font-medium text-primary">
                      Đã tải lên tệp:{" "}
                      <a
                        href={form.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Xem tài liệu
                      </a>
                    </div>
                  )}
                </div>
              </>
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
                    onChange={(e) => {
                      set("swapWithDate", e.target.value)
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Ca của đồng nghiệp</label>
                  <select
                    value={form.swapWithShiftId}
                    onChange={(e) => {
                      set("swapWithShiftId", e.target.value)
                    }}
                    className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn ca làm việc --</option>
                    {partnerShifts.length > 0 ? (
                      partnerShifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shift?.name ?? s.name} (
                          {formatTime(s.shift?.startTime ?? s.startTime ?? 0)} -{" "}
                          {formatTime(s.shift?.endTime ?? s.endTime ?? 0)})
                        </option>
                      ))
                    ) : form.swapWithDate && form.swapWithEmployeeId ? (
                      <option disabled value="">
                        Không có ca trong ngày này
                      </option>
                    ) : (
                      <option disabled value="">
                        Chọn ngày và nhân sự trước
                      </option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nhân sự đổi ca</label>
                  <select
                    value={form.swapWithEmployeeId}
                    onChange={(e) => {
                      set("swapWithEmployeeId", e.target.value)
                    }}
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
                onChange={(e) => {
                  set("reason", e.target.value)
                }}
                className="w-full p-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
