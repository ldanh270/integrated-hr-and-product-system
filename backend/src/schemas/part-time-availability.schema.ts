import {
  PART_TIME_AVAILABILITY_RULES,
  PART_TIME_AVAILABILITY_STATUSES,
} from "@/configs/entities/part-time-availability.config.ts"
import { DAY_OF_WEEK_VALUES } from "@/configs/entities/attendance.config.ts"

import { z } from "zod"

const timeStringSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format must be HH:mm")

const slotSchema = z
  .object({
    startTime: timeStringSchema,
    endTime: timeStringSchema,
  })
  .strict()

// One row per weekday; isBusyAllDay=true means admin must not assign any shift that day.
const daySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isBusyAllDay: z.boolean(),
    slots: z.array(slotSchema).max(PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY),
  })
  .strict()

// status optional in schema but service upsertMine always persists submitted — enters admin assign roster, not an approval gate.
export const upsertPartTimeAvailabilitySchema = z
  .object({
    weekStart: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" }),
    note: z.string().max(500).nullable().optional(),
    status: z.enum(PART_TIME_AVAILABILITY_STATUSES).optional(),
    days: z.array(daySchema).min(1).max(DAY_OF_WEEK_VALUES.length),
  })
  .strict()

export type UpsertPartTimeAvailabilitySchemaType = z.infer<typeof upsertPartTimeAvailabilitySchema>

export const weekStartQuerySchema = z.object({
  weekStart: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Invalid date format" }),
})

// Admin shift assignment: both times null = skip that day; both set = create override within employee free slot.
export const assignPartTimeShiftsSchema = z
  .object({
    assignments: z
      .array(
        z
          .object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: timeStringSchema.nullable(),
            endTime: timeStringSchema.nullable(),
          })
          .strict()
          .refine(
            (value) =>
              (value.startTime === null && value.endTime === null) ||
              (value.startTime !== null && value.endTime !== null),
            { message: "Phải nhập đủ giờ bắt đầu và kết thúc" },
          ),
      )
      .min(1),
  })
  .strict()

export type AssignPartTimeShiftsSchemaType = z.infer<typeof assignPartTimeShiftsSchema>

// Rejection requires a reason so employee knows what to fix before resubmitting.
export const rejectPartTimeAvailabilitySchema = z
  .object({
    rejectReason: z.string().min(1).max(500),
  })
  .strict()

export type RejectPartTimeAvailabilitySchemaType = z.infer<typeof rejectPartTimeAvailabilitySchema>
