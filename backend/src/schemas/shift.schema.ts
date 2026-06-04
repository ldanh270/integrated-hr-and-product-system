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
    employeeId: z.string(), // Note: Use .uuid() if strict, or leave string
    workingShiftId: z.string(),
    days: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      shiftId: z.string()
    })).optional(),
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
