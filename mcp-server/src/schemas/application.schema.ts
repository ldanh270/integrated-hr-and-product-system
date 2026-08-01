import { z } from "zod"

import {
  APPLICATION_STATUSES,
  APPLICATION_TYPE_VALUES,
  LEAVE_TYPE_VALUES,
  REGIME_TYPES,
} from "../constants/entities/attendance.config.js"

// ─── Enums ────────────────────────────────────────────────────────────────────
const ApplicationTypeEnum = z.enum(APPLICATION_TYPE_VALUES)
const ApplicationStatusEnum = z.enum(APPLICATION_STATUSES)

// ─── Detail schemas per type ──────────────────────────────────────────────────

// leave
export const LeaveDetailSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPE_VALUES),
    regimeType: z.enum(REGIME_TYPES),
  })
  .strict()

// overtime
export const OvertimeDetailSchema = z
  .object({
    employeeShiftId: z.string(),
  })
  .strict()

// work_from_home
export const WFHDetailSchema = z
  .object({
    employeeShiftId: z.string().cuid("Invalid shift ID"),
    location: z.string().max(255).optional(),
  })
  .strict()

// shift_swap
export const ShiftSwapDetailSchema = z
  .object({
    employeeShiftId: z.string(),
    workingShiftId: z.string().optional(),
    swapWithEmployeeId: z.string().optional(),
    swapWithShiftId: z.string().optional(),
  })
  .strict()

// late_early
export const LateEarlyDetailSchema = z
  .object({
    employeeShiftId: z.string(),
    durationMinutes: z.number().int().min(1).max(480),
    isLate: z.boolean(),
  })
  .strict()

export const ForgotCardDetailSchema = z.object({
  employeeShiftId: z.string().cuid("Invalid shift ID"),
  checkInAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid check-in time").nullable().optional(),
  checkOutAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid check-out time").nullable().optional(),
  documentUrl: z.string().url().nullable().optional(),
}).refine(({ checkInAt, checkOutAt }) => Boolean(checkInAt || checkOutAt), {
  message: "At least one of checkInAt or checkOutAt is required",
})

export const RegimeDetailSchema = z.object({
  regimeCategoryId: z.string().cuid("Invalid regime category ID"),
  lateMinutes: z.number().int().min(0).max(480).default(0),
  earlyMinutes: z.number().int().min(0).max(480).default(0),
  documentUrl: z.string().url().nullable().optional(),
})

export const RecruitmentDetailSchema = z.object({
  positionId: z.string().cuid("Invalid position ID").optional(),
  positionName: z.string().min(1),
  quantity: z.number().int().min(1),
  requirements: z.string().optional(),
})

// resignation
export const ResignationDetailSchema = z.object({}).strict()

// ─── Base fields ──────────────────────────────────────────────────────────────
// Shared optional fields in all application types
export const ApplicationBaseOptionalSchema = z
  .object({
    reason: z.string().min(5).max(500).optional(),
    note: z.string().max(1000).optional(),
    assignedToId: z.string().optional(),
  })
  .strict()

const applicationDates = {
  startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date format"),
  endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date format").optional(),
}

export const ApplicationFormSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("leave"), ...applicationDates, endDate: applicationDates.endDate.unwrap(), ...ApplicationBaseOptionalSchema.shape, detail: LeaveDetailSchema }).strict(),
  z.object({ type: z.literal("overtime"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: OvertimeDetailSchema }).strict(),
  z.object({ type: z.literal("work_from_home"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: WFHDetailSchema }).strict(),
  z.object({ type: z.literal("shift_swap"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: ShiftSwapDetailSchema }).strict(),
  z.object({ type: z.literal("late_early"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: LateEarlyDetailSchema }).strict(),
  z.object({ type: z.literal("forgot_card"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: ForgotCardDetailSchema }).strict(),
  z.object({ type: z.literal("regime"), ...applicationDates, endDate: applicationDates.endDate.unwrap(), ...ApplicationBaseOptionalSchema.shape, detail: RegimeDetailSchema }).strict(),
  z.object({ type: z.literal("resignation"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: ResignationDetailSchema }).strict(),
  z.object({ type: z.literal("recruitment"), ...applicationDates, ...ApplicationBaseOptionalSchema.shape, detail: RecruitmentDetailSchema }).strict(),
])

// ─── List filter schema ───────────────────────────────────────────────────────
export const ListApplicationsSchema = z
  .object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    type: ApplicationTypeEnum.optional(),
    status: ApplicationStatusEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    employeeId: z.string().optional(),
  })
  .strict()

// ─── Approve / Reject ─────────────────────────────────────────────────────────
export const ApproveApplicationSchema = z
  .object({
    status: z.literal("approved"),
  })
  .strict()

export const RejectApplicationSchema = z
  .object({
    rejectReason: z.string().min(5).max(500),
  })
  .strict()

// ─── Create Payload Type ───────────────────────────────────────────────────────
// This is the combined payload that the service will expect
export type CreateApplicationPayload = {
  type: z.infer<typeof ApplicationTypeEnum>
  startDate: string
  endDate?: string
  reason?: string
  note?: string
  assignedToId?: string
  detail?:
    | z.infer<typeof LeaveDetailSchema>
    | z.infer<typeof OvertimeDetailSchema>
    | z.infer<typeof WFHDetailSchema>
    | z.infer<typeof ShiftSwapDetailSchema>
    | z.infer<typeof LateEarlyDetailSchema>
    | z.infer<typeof ForgotCardDetailSchema>
    | z.infer<typeof RegimeDetailSchema>
    | z.infer<typeof RecruitmentDetailSchema>
    | z.infer<typeof ResignationDetailSchema>
}

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type ListApplicationsInput = z.infer<typeof ListApplicationsSchema>
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>
