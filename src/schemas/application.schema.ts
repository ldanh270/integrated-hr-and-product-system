import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────
const ApplicationTypeEnum = z.enum([
	"leave",
	"overtime",
	"work_from_home",
	"shift_swap",
	"business_trip",
	"late_early",
	"regime",
]);

const ApplicationStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);

// ─── Detail schemas per type ──────────────────────────────────────────────────

// leave
export const LeaveDetailSchema = z.object({
	leaveType: z.string(), // enum from backend
	regimeType: z.string(), // enum from backend
});

// overtime
export const OvertimeDetailSchema = z.object({
	employeeShiftId: z.string(),
});

// work_from_home
export const WFHDetailSchema = z.object({
	location: z.string().max(255).optional(),
});

// shift_swap
export const ShiftSwapDetailSchema = z.object({
	employeeShiftId: z.string(),
	workingShiftId: z.string().optional(),
	swapWithEmployeeId: z.string().optional(),
	swapWithShiftId: z.string().optional(),
});

// business_trip
export const BusinessTripDetailSchema = z.object({
	location: z.string().min(2).max(255),
	purpose: z.string().max(500).optional(),
	budget: z.number().optional(),
});

// late_early
export const LateEarlyDetailSchema = z.object({
	employeeShiftId: z.string(),
	durationMinutes: z.number().int().min(1).max(480),
	isLate: z.boolean(),
});

// regime
export const RegimeDetailSchema = z.object({
	regimeType: z.string(),
	reducedMinutesPerDay: z.number().int().min(0).max(480),
	applyToStart: z.boolean().optional(),
	applyToEnd: z.boolean().optional(),
	documentUrl: z.string().url().optional(),
});

// ─── Base fields ──────────────────────────────────────────────────────────────
// Shared optional fields in all application types
export const ApplicationBaseOptionalSchema = z.object({
	reason: z.string().min(5).max(500).optional(),
	note: z.string().max(1000).optional(),
	assignedToId: z.string().optional(),
});

// ─── List filter schema ───────────────────────────────────────────────────────
export const ListApplicationsSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	type: ApplicationTypeEnum.optional(),
	status: ApplicationStatusEnum.optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	employeeId: z.string().optional(),
});

// ─── Approve / Reject ─────────────────────────────────────────────────────────
export const ApproveApplicationSchema = z.object({
	status: z.literal("approved"),
});

export const RejectApplicationSchema = z.object({
	rejectReason: z.string().min(5).max(500),
});

// ─── Create Payload Type ───────────────────────────────────────────────────────
// This is the combined payload that the service will expect
export type CreateApplicationPayload = {
	type: z.infer<typeof ApplicationTypeEnum>;
	startDate: string;
	endDate?: string;
	reason?: string;
	note?: string;
	assignedToId?: string;
	detail:
		| z.infer<typeof LeaveDetailSchema>
		| z.infer<typeof OvertimeDetailSchema>
		| z.infer<typeof WFHDetailSchema>
		| z.infer<typeof ShiftSwapDetailSchema>
		| z.infer<typeof BusinessTripDetailSchema>
		| z.infer<typeof LateEarlyDetailSchema>
		| z.infer<typeof RegimeDetailSchema>;
};

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type ListApplicationsInput = z.infer<typeof ListApplicationsSchema>;
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
