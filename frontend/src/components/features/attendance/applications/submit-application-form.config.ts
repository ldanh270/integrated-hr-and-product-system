export const LEAVE_TYPE_OPTIONS = [
  { value: "annual_leave", label: "Nghỉ phép năm" },
  { value: "sick_leave", label: "Nghỉ ốm" },
  { value: "maternity_leave", label: "Thai sản" },
  { value: "bereavement_leave", label: "Nghỉ tang" },
  { value: "marriage_leave", label: "Nghỉ cưới" },
  { value: "unpaid_leave", label: "Nghỉ không lương" },
  { value: "other", label: "Khác" },
] as const

export type SubmitApplicationForm = {
  startDate: string
  endDate: string
  reason: string
  note: string
  leaveType: string
  leaveRegimeType: "paid" | "unpaid"
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean
  swapWithEmployeeId: string
  swapWithShiftId: string
  location: string
  destination: string
  purpose: string
  regimeType: "paid" | "unpaid"
  reducedMinutesPerDay: number
  applyToStart: boolean
  applyToEnd: boolean
  documentUrl: string
}

export const INPUT_CLASS =
  "px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
export const LABEL_CLASS = "text-xs font-semibold text-muted-foreground"

export function toggleClass(active: boolean) {
  return active
    ? "border-primary bg-primary/5 text-primary"
    : "border-border text-muted-foreground"
}

export const INITIAL_SUBMIT_FORM: SubmitApplicationForm = {
  startDate: "",
  endDate: "",
  reason: "",
  note: "",
  leaveType: "annual_leave",
  leaveRegimeType: "paid",
  employeeShiftId: "",
  durationMinutes: 30,
  isLate: true,
  swapWithEmployeeId: "",
  swapWithShiftId: "",
  location: "",
  destination: "",
  purpose: "",
  regimeType: "paid",
  reducedMinutesPerDay: 0,
  applyToStart: false,
  applyToEnd: false,
  documentUrl: "",
}

type DetailResult = { detail: Record<string, unknown> } | { error: string }

export function buildApplicationDetail(selectedType: string, form: SubmitApplicationForm): DetailResult {
  switch (selectedType) {
    case "leave":
      return { detail: { leaveType: form.leaveType, regimeType: form.leaveRegimeType } }
    case "overtime":
      if (!form.employeeShiftId.trim()) return { error: "Vui lòng nhập ID ca làm việc" }
      return { detail: { employeeShiftId: form.employeeShiftId.trim() } }
    case "late_early":
      if (!form.employeeShiftId.trim()) return { error: "Vui lòng nhập ID ca làm việc" }
      if (form.durationMinutes < 1 || form.durationMinutes > 480) {
        return { error: "Số phút muộn/sớm phải từ 1 đến 480" }
      }
      return {
        detail: {
          employeeShiftId: form.employeeShiftId.trim(),
          ...(form.isLate
            ? { lateMinutes: form.durationMinutes }
            : { earlyMinutes: form.durationMinutes }),
        },
      }
    case "shift_swap":
      if (!form.employeeShiftId.trim()) return { error: "Vui lòng nhập ID ca của bạn" }
      return {
        detail: {
          employeeShiftId: form.employeeShiftId.trim(),
          ...(form.swapWithEmployeeId.trim() ? { swapWithEmployeeId: form.swapWithEmployeeId.trim() } : {}),
          ...(form.swapWithShiftId.trim() ? { swapWithShiftId: form.swapWithShiftId.trim() } : {}),
        },
      }
    case "work_from_home":
      return { detail: form.location.trim() ? { location: form.location.trim() } : {} }
    case "business_trip":
      if (!form.destination.trim()) return { error: "Vui lòng nhập địa điểm công tác" }
      return {
        detail: {
          location: form.destination.trim(),
          ...(form.purpose.trim() ? { purpose: form.purpose.trim() } : {}),
        },
      }
    case "regime":
      return {
        detail: {
          regimeType: form.regimeType,
          reducedMinutesPerDay: form.reducedMinutesPerDay,
          applyToStart: form.applyToStart,
          applyToEnd: form.applyToEnd,
          ...(form.documentUrl.trim() ? { documentUrl: form.documentUrl.trim() } : {}),
        },
      }
    default:
      return { detail: {} }
  }
}
