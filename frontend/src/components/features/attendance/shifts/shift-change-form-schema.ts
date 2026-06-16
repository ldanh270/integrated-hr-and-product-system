import { z } from "zod"

export const shiftChangeFormSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  startDate: z.string().min(1, "Please select a date"),
  employeeShiftId: z.string().min(1, "Select current shift"),
  swapWithEmployeeId: z.string().min(1, "Select colleague to swap with"),
  swapWithShiftId: z.string().min(1, "Select target shift"),
})

export type ShiftChangeFormValues = z.infer<typeof shiftChangeFormSchema>

export const DEFAULT_SHIFT_CHANGE_FORM_VALUES: ShiftChangeFormValues = {
  reason: "",
  startDate: "",
  employeeShiftId: "",
  swapWithEmployeeId: "",
  swapWithShiftId: "",
}
