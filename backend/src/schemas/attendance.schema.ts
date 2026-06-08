import {
  APPLICATION_STATUSES,
  APPLICATION_TYPE_VALUES,
  APPLICATION_TYPES,
  ATTENDANCE_STATUSES,
  HOLIDAY_TYPES,
  LEAVE_TYPE_VALUES,
  REGIME_TYPES,
} from "@/configs/entities/attendance.config.ts"

import { z } from "zod"

const gpsScanSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// ─── ATTENDANCE RECORD (Check In/Out) ────────────────────────
export const checkInSchema = z
  .object({
    location: gpsScanSchema,
  })
  .strict()

export type CheckInSchemaType = z.infer<typeof checkInSchema>

export const checkOutSchema = z
  .object({
    location: gpsScanSchema,
  })
  .strict()

export type CheckOutSchemaType = z.infer<typeof checkOutSchema>

// ─── QUERY & REPORT ──────────────────────────────────────────
export const attendanceRecordQuerySchema = z
  .object({
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .optional(),
    employeeId: z.string().optional(),
    status: z.enum(ATTENDANCE_STATUSES).optional(),
  })
  .strict()

export type AttendanceRecordQuerySchemaType = z.infer<typeof attendanceRecordQuerySchema>

// ─── APPLICATIONS (Leave, OT, Swap, etc.) ───────────────────

const baseApplicationSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(5).max(500).optional(),
  note: z.string().max(500).optional(),
  workingShiftId: z.string().optional(),
})

const leaveDetailSchema = z.object({
  leaveType: z.enum(LEAVE_TYPE_VALUES),
  documentUrl: z.string().url().optional().or(z.literal("")),
})

const shiftSwapDetailSchema = z.object({
  employeeShiftId: z.string().cuid(),
  workingShiftId: z.string().cuid().optional(),
  swapWithEmployeeId: z.string().cuid(),
  swapWithShiftId: z.string().cuid(),
})

const overtimeDetailSchema = z.object({
  employeeShiftId: z.string().cuid(),
  expectedMinutes: z.number().int().positive().optional(),
})

const regimeDetailSchema = z.object({
  regimeType: z.enum(REGIME_TYPES),
  reducedMinutesPerDay: z.number().int().min(0),
  applyToStart: z.boolean(),
  applyToEnd: z.boolean(),
  documentUrl: z.string().url().optional().or(z.literal("")),
})

const lateEarlyDetailSchema = z.object({
  employeeShiftId: z.string().cuid(),
  durationMinutes: z.number().int().positive(),
  isLate: z.boolean(),
})

export const submitApplicationSchema = z.discriminatedUnion("type", [
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.LEAVE.LABEL),
    leaveDetail: leaveDetailSchema,
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.OVERTIME.LABEL),
    overtimeDetail: overtimeDetailSchema,
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.SHIFT_SWAP.LABEL),
    shiftSwapDetail: shiftSwapDetailSchema,
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.REGIME.LABEL),
    regimeDetail: regimeDetailSchema,
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.LATE_EARLY.LABEL),
    lateEarlyDetail: lateEarlyDetailSchema,
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.WORK_FROM_HOME.LABEL),
  }),
  baseApplicationSchema.extend({
    type: z.literal(APPLICATION_TYPES.BUSINESS_TRIP.LABEL),
  }),
])

export type SubmitApplicationSchemaType = z.infer<typeof submitApplicationSchema>

export const approveApplicationSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES),
    rejectReason: z.string().max(500).optional(),
  })
  .strict()

export type ApproveApplicationSchemaType = z.infer<typeof approveApplicationSchema>

// ─── HOLIDAY ──────────────────────────────────────────────────
export const createHolidaySchema = z
  .object({
    name: z.string().min(2).max(100),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    type: z.enum(HOLIDAY_TYPES),
  })
  .strict()

export type CreateHolidaySchemaType = z.infer<typeof createHolidaySchema>
