import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  ATTENDANCE_STATUSES,
  REGIME_TYPES,
} from "@/configs/entities.config.ts"

import { z } from "zod"

const objectIdRegex = /^[0-9a-fA-F]{24}$/

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
    employeeId: z.string().regex(objectIdRegex, "Invalid ObjectId").optional(),
    status: z.enum(ATTENDANCE_STATUSES).optional(),
  })
  .strict()

export type AttendanceRecordQuerySchemaType = z.infer<typeof attendanceRecordQuerySchema>

// ─── APPLICATIONS (Leave, OT, Swap) ──────────────────────────
export const submitApplicationSchema = z
  .object({
    type: z.enum(APPLICATION_TYPES),
    reason: z.string().min(5).max(500),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .optional(),
    regimeType: z.enum(REGIME_TYPES).optional(),
    swapWith: z.string().regex(objectIdRegex, "Invalid ObjectId").optional(),
  })
  .strict()

export type SubmitApplicationSchemaType = z.infer<typeof submitApplicationSchema>

export const approveApplicationSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES),
  })
  .strict()

export type ApproveApplicationSchemaType = z.infer<typeof approveApplicationSchema>

// ─── HOLIDAY ──────────────────────────────────────────────────
export const createHolidaySchema = z
  .object({
    name: z.string().min(2).max(100),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    type: z.enum(["national", "company"]),
  })
  .strict()

export type CreateHolidaySchemaType = z.infer<typeof createHolidaySchema>
