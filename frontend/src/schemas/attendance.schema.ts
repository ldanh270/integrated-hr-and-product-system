import {
  APPLICATION_TYPE_VALUES,
  LEAVE_TYPES,
  REGIME_TYPES,
  WORK_MODES,
} from "@/config/entities/attendance.config"

import { z } from "zod"

// Base details schema
const baseDetailsSchema = z.object({
  reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự"),
  note: z.string().optional(),
})

// Leave details
const leaveDetailsSchema = baseDetailsSchema.extend({
  leaveType: z.string().min(1, "Vui lòng chọn loại phép"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  totalDays: z.number().min(0.5, "Số ngày nghỉ tối thiểu là 0.5"),
})

// OT details
const otDetailsSchema = baseDetailsSchema.extend({
  otDate: z.string().min(1, "Vui lòng chọn ngày làm thêm"),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
  totalHours: z.number().min(0.5, "Số giờ OT tối thiểu là 0.5"),
})

// Shift Swap details
const shiftSwapDetailsSchema = baseDetailsSchema.extend({
  fromShiftId: z.string().min(1, "Vui lòng chọn ca hiện tại"),
  toShiftId: z.string().min(1, "Vui lòng chọn ca muốn đổi"),
  swapDate: z.string().min(1, "Vui lòng chọn ngày đổi ca"),
})

// WFH details
const wfhDetailsSchema = baseDetailsSchema.extend({
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  workMode: z.string().optional(),
})

export const applicationSchema = z.object({
  type: z.enum(APPLICATION_TYPE_VALUES),
  details: z.union([
    leaveDetailsSchema,
    otDetailsSchema,
    shiftSwapDetailsSchema,
    wfhDetailsSchema,
    baseDetailsSchema,
  ]),
})

export type ApplicationSchemaType = z.infer<typeof applicationSchema>
