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
    | z.infer<typeof ResignationDetailSchema>
}

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type ListApplicationsInput = z.infer<typeof ListApplicationsSchema>
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>
