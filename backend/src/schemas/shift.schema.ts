import { z } from "zod"

const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).optional(),
})

// ─── WORKING SHIFT ───────────────────────────────────────────
export const createWorkingShiftSchema = z
  .object({
    name: z.string().min(2).max(100).trim(),
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format must be HH:mm"),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format must be HH:mm"),
    gracePeriodMinutes: z.number().min(0).optional(),
    gps: gpsSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export type CreateWorkingShiftSchemaType = z.infer<typeof createWorkingShiftSchema>

export const updateWorkingShiftSchema = createWorkingShiftSchema.partial().strict()

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
