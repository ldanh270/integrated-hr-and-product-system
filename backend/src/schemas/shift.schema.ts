import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import {
  ATTENDANCE_GPS_RULES,
  ATTENDANCE_TIME_RULES,
  WORKING_SHIFT_RULES,
} from "@/configs/rules/attendance.config.ts"

import { z } from "zod"

const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** Same floor as shift UI — geofence for full-time shifts and onsite PT check-in. */
  radiusMeters: z.number().min(ATTENDANCE_GPS_RULES.MIN_GEOFENCE_RADIUS_METERS).optional(),
})

/** null clears GPS on PATCH; omitted leaves existing geofence unchanged. */
const gpsFieldSchema = z.union([gpsSchema, z.null()]).optional()
const timeFieldSchema = z
  .string()
  .regex(WORKING_SHIFT_RULES.TIME_INPUT_PATTERN, ATTENDANCE_ERROR_MESSAGES.SHIFT_TIME_FORMAT)

/** Converts API HH:mm values into the minute-of-day representation used by Prisma. */
function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR + minutes
}

function validateBreakTime(
  data: {
    startTime?: string
    endTime?: string
    breakStartTime?: string | null
    breakEndTime?: string | null
  },
  context: z.RefinementCtx,
): void {
  // A half-defined break is ambiguous: null/null means no unpaid break.
  const breakStartTime = data.breakStartTime
  const breakEndTime = data.breakEndTime
  const hasBreakStart = breakStartTime != null
  const hasBreakEnd = breakEndTime != null
  if (hasBreakStart !== hasBreakEnd) {
    context.addIssue({
      code: "custom",
      path: hasBreakStart ? ["breakEndTime"] : ["breakStartTime"],
      message: ATTENDANCE_ERROR_MESSAGES.SHIFT_BREAK_PAIR_REQUIRED,
    })
    return
  }
  if (breakStartTime == null || breakEndTime == null || !data.startTime || !data.endTime) return
  const start = timeToMinutes(data.startTime)
  const end = timeToMinutes(data.endTime)
  const breakStart = timeToMinutes(breakStartTime)
  const breakEnd = timeToMinutes(breakEndTime)

  // Strict inequalities prevent zero-length breaks and breaks touching shift boundaries.
  if (!(start < breakStart && breakStart < breakEnd && breakEnd < end)) {
    context.addIssue({
      code: "custom",
      path: ["breakStartTime"],
      message: ATTENDANCE_ERROR_MESSAGES.SHIFT_BREAK_OUTSIDE_SHIFT,
    })
  }
}

// ─── WORKING SHIFT ───────────────────────────────────────────
const workingShiftFields = {
  name: z.string().min(2).max(100).trim(),
  startTime: timeFieldSchema,
  endTime: timeFieldSchema,
  breakStartTime: z.union([timeFieldSchema, z.null()]).optional(),
  breakEndTime: z.union([timeFieldSchema, z.null()]).optional(),
  gracePeriodMinutes: z
    .number()
    .min(WORKING_SHIFT_RULES.MIN_MINUTES_FROM_MIDNIGHT)
    .max(WORKING_SHIFT_RULES.MAX_GRACE_PERIOD_MINUTES)
    .optional(),
  gps: gpsFieldSchema,
  isActive: z.boolean().optional(),
}

export const createWorkingShiftSchema = z
  .object(workingShiftFields)
  .strict()
  .superRefine(validateBreakTime)

export type CreateWorkingShiftSchemaType = z.infer<typeof createWorkingShiftSchema>

export const updateWorkingShiftSchema = z
  .object(workingShiftFields)
  .partial()
  .strict()
  .superRefine(validateBreakTime)

export type UpdateWorkingShiftSchemaType = z.infer<typeof updateWorkingShiftSchema>

// ─── SHIFT SCHEDULE ──────────────────────────────────────────
export const assignShiftScheduleSchema = z
  .object({
    employeeId: z.string().min(1),
    days: z
      .array(
        z.object({
          dayOfWeek: z.number().min(0).max(6),
          shiftId: z.string().min(1),
        }),
      )
      .min(1, "At least one day assignment is required"),
    validFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    validTo: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .nullable()
      .optional(),
  })
  .strict()

export type AssignShiftScheduleSchemaType = z.infer<typeof assignShiftScheduleSchema>

// ─── EMPLOYEE SHIFT OVERRIDE ─────────────────────────────────
export const overrideEmployeeShiftSchema = z
  .object({
    employeeId: z.string(),
    shiftId: z.string(),
    assignedDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  })
  .strict()

export type OverrideEmployeeShiftSchemaType = z.infer<typeof overrideEmployeeShiftSchema>

// ─── SHIFT GENERATION ─────────────────────────────────────────
export const generateShiftsSchema = z
  .object({
    employeeIds: z.array(z.string().min(1)).min(1),
    startDate: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" }),
    endDate: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" }),
  })
  .strict()

export type GenerateShiftsSchemaType = z.infer<typeof generateShiftsSchema>

// ─── SHIFT CHANGE REQUEST ─────────────────────────────────────
export const submitShiftChangeRequestSchema = z
  .object({
    reason: z.string().min(5).max(500),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .optional(),
    employeeShiftId: z.string().min(1),
    swapWithEmployeeId: z.string().min(1),
    swapWithShiftId: z.string().min(1),
    workingShiftId: z.string().min(1).optional(),
  })
  .strict()

export type SubmitShiftChangeRequestSchemaType = z.infer<typeof submitShiftChangeRequestSchema>
