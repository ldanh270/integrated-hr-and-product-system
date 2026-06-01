import { z } from "zod"

const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).optional(),
})

const objectIdRegex = /^[0-9a-fA-F]{24}$/

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
    employeeId: z.string().regex(objectIdRegex, "Invalid ObjectId"),
    weekdays: z.object({
      mon: z.string().regex(objectIdRegex).nullable().optional(),
      tue: z.string().regex(objectIdRegex).nullable().optional(),
      wed: z.string().regex(objectIdRegex).nullable().optional(),
      thu: z.string().regex(objectIdRegex).nullable().optional(),
      fri: z.string().regex(objectIdRegex).nullable().optional(),
      sat: z.string().regex(objectIdRegex).nullable().optional(),
      sun: z.string().regex(objectIdRegex).nullable().optional(),
    }),
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
    employeeId: z.string().regex(objectIdRegex, "Invalid ObjectId"),
    shiftId: z.string().regex(objectIdRegex, "Invalid ObjectId"),
    assignedDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  })
  .strict()

export type OverrideEmployeeShiftSchemaType = z.infer<typeof overrideEmployeeShiftSchema>
