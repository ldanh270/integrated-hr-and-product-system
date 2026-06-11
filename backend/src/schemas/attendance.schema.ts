import {
  APPLICATION_STATUSES,
  APPLICATION_TYPE_VALUES,
  ATTENDANCE_STATUSES,
  HOLIDAY_TYPES,
  LEAVE_TYPE_VALUES,
  REGIME_TYPES,
} from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/constants/attendance.constants.ts"

import { z } from "zod"

// ─── GPS ──────────────────────────────────────────────────────

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
      .refine((val) => !isNaN(Date.parse(val)), {
        message: ATTENDANCE_ERROR_MESSAGES.INVALID_DATE_FORMAT,
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: ATTENDANCE_ERROR_MESSAGES.INVALID_DATE_FORMAT,
      })
      .optional(),
    employeeId: z.string().cuid("Invalid employee ID").optional(),
    status: z.enum(ATTENDANCE_STATUSES).optional(),
  })
  .strict()

export type AttendanceRecordQuerySchemaType = z.infer<typeof attendanceRecordQuerySchema>

// ─── SHARED DATE FIELD ───────────────────────────────────────

const dateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })

const baseApplicationFields = {
  startDate: dateString,
  endDate: dateString.optional(),
  reason: z.string().min(5).max(500).optional(),
  note: z.string().max(1000).optional(),
}

// ─── TYPE-SPECIFIC APPLICATION SCHEMAS ───────────────────────

/** leave: nghỉ phép — requires leaveType + regimeType */
const leaveApplicationSchema = z
  .object({
    type: z.literal("leave"),
    ...baseApplicationFields,
    endDate: dateString, // required for leave
    detail: z.object({
      leaveType: z.enum(LEAVE_TYPE_VALUES),
      regimeType: z.enum(REGIME_TYPES),
    }),
  })
  .strict()

/** overtime: làm thêm giờ — requires employeeShiftId */
const overtimeApplicationSchema = z
  .object({
    type: z.literal("overtime"),
    ...baseApplicationFields,
    detail: z.object({
      employeeShiftId: z.string().cuid("Invalid shift ID"),
    }),
  })
  .strict()

/** work_from_home: WFH — optional location */
const workFromHomeApplicationSchema = z
  .object({
    type: z.literal("work_from_home"),
    ...baseApplicationFields,
    detail: z
      .object({
        location: z.string().max(255).optional(),
      })
      .optional()
      .default({}),
  })
  .strict()

/** shift_swap: đổi ca — requires own employeeShiftId, optionally target */
const shiftSwapApplicationSchema = z
  .object({
    type: z.literal("shift_swap"),
    ...baseApplicationFields,
    detail: z.object({
      employeeShiftId: z.string().cuid("Invalid shift ID"),
      workingShiftId: z.string().cuid("Invalid working shift ID").optional(),
      swapWithEmployeeId: z.string().cuid("Invalid employee ID").optional(),
      swapWithShiftId: z.string().cuid("Invalid shift ID").optional(),
    }),
  })
  .strict()

/** business_trip: công tác — requires location */
const businessTripApplicationSchema = z
  .object({
    type: z.literal("business_trip"),
    ...baseApplicationFields,
    detail: z.object({
      location: z.string().min(2).max(255),
      purpose: z.string().max(500).optional(),
      budget: z.number().positive().optional(),
    }),
  })
  .strict()

/** late_early: đi muộn/về sớm — requires shift ref + duration */
const lateEarlyApplicationSchema = z
  .object({
    type: z.literal("late_early"),
    ...baseApplicationFields,
    detail: z.object({
      employeeShiftId: z.string().cuid("Invalid shift ID"),
      durationMinutes: z.number().int().min(1).max(480),
      isLate: z.boolean(),
    }),
  })
  .strict()

/** regime: thai sản/bệnh — requires regimeType + reduced time */
const regimeApplicationSchema = z
  .object({
    type: z.literal("regime"),
    ...baseApplicationFields,
    detail: z.object({
      regimeType: z.enum(REGIME_TYPES),
      reducedMinutesPerDay: z.number().int().min(0).max(480),
      applyToStart: z.boolean().default(false),
      applyToEnd: z.boolean().default(false),
      documentUrl: z.string().url("Invalid URL").optional(),
    }),
  })
  .strict()

// ─── DISCRIMINATED UNION ─────────────────────────────────────

export const submitApplicationSchema = z.discriminatedUnion("type", [
  leaveApplicationSchema,
  overtimeApplicationSchema,
  workFromHomeApplicationSchema,
  shiftSwapApplicationSchema,
  businessTripApplicationSchema,
  lateEarlyApplicationSchema,
  regimeApplicationSchema,
])

export type SubmitApplicationSchemaType = z.infer<typeof submitApplicationSchema>

// ─── APPROVE ─────────────────────────────────────────────────

/**
 * Used by PATCH /:id/approve — only accepts status=approved.
 * Reject is handled by its own endpoint and schema.
 */
export const approveApplicationSchema = z
  .object({
    status: z.literal("approved"),
  })
  .strict()

export type ApproveApplicationSchemaType = z.infer<typeof approveApplicationSchema>

// ─── REJECT ──────────────────────────────────────────────────

/**
 * Used by PATCH /:id/reject — rejectReason is mandatory (min 5 chars).
 */
export const rejectApplicationSchema = z
  .object({
    status: z.literal("rejected").optional(),
    rejectReason: z.string().trim().min(5, "rejectReason must be at least 5 characters").max(500),
  })
  .strict()

export type RejectApplicationSchemaType = z.infer<typeof rejectApplicationSchema>

// ─── CANCEL ──────────────────────────────────────────────────

export const cancelApplicationSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict()

export type CancelApplicationSchemaType = z.infer<typeof cancelApplicationSchema>

// ─── LIST / QUERY ─────────────────────────────────────────────

export const listApplicationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(APPLICATION_TYPE_VALUES).optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    employeeId: z.string().cuid("Invalid employee ID").optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
  })
  .strict()

export type ListApplicationsQuerySchemaType = z.infer<typeof listApplicationsQuerySchema>

// ─── HOLIDAY ─────────────────────────────────────────────────

export const createHolidaySchema = z
  .object({
    name: z.string().min(2).max(100),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: ATTENDANCE_ERROR_MESSAGES.INVALID_DATE_FORMAT,
    }),
    type: z.enum(HOLIDAY_TYPES),
  })
  .strict()

export type CreateHolidaySchemaType = z.infer<typeof createHolidaySchema>
