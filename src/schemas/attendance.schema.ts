import { z } from "zod";

// ─── Attendance ───────────────────────────────────────────────────────────────

/** Location payload shared by check-in, check-out, and scan */
export const LocationSchema = z.object({
	lat: z.number().min(-90).max(90).describe("Latitude (-90 to 90)"),
	lng: z.number().min(-180).max(180).describe("Longitude (-180 to 180)"),
});

export const AttendanceStatusEnum = z.enum([
	"on_time",
	"late",
	"early_leave",
	"absent",
	"overtime",
]);

/** Params for GET /api/attendance */
export const GetAttendanceSchema = z.object({
	startDate: z.string().datetime({ message: "startDate must be an ISO 8601 datetime" }).optional(),
	endDate: z.string().datetime({ message: "endDate must be an ISO 8601 datetime" }).optional(),
	employeeId: z.string().optional(),
	status: AttendanceStatusEnum.optional(),
});

// ─── Shifts ───────────────────────────────────────────────────────────────────

/** Minutes from midnight (0 = 00:00, 480 = 08:00, 1020 = 17:00) */
const minutesFromMidnight = z
	.number()
	.int()
	.min(0)
	.max(1439)
	.describe("Minutes from midnight (e.g. 480 = 08:00, 1020 = 17:00)");

export const CreateShiftSchema = z.object({
	name: z.string().min(1).describe("Name of the shift"),
	startTime: minutesFromMidnight.describe("Shift start time in minutes from midnight"),
	endTime: minutesFromMidnight.describe("Shift end time in minutes from midnight"),
});

export const UpdateShiftSchema = z.object({
	name: z.string().min(1).optional(),
	startTime: minutesFromMidnight.optional(),
	endTime: minutesFromMidnight.optional(),
});

// ─── Schedules ────────────────────────────────────────────────────────────────

export const AssignScheduleSchema = z.object({
	employeeId: z.string().describe("ID of the employee"),
	workingShiftId: z.string().describe("ID of the working shift to assign"),
	effectiveDate: z
		.string()
		.datetime()
		.describe("Date from which this schedule takes effect (ISO 8601)"),
});

export const OverrideScheduleSchema = z.object({
	employeeId: z.string().describe("ID of the employee"),
	workingShiftId: z.string().describe("ID of the working shift for this specific date"),
	date: z.string().datetime().describe("The specific date to override (ISO 8601)"),
});

// ─── Shift Change Requests ────────────────────────────────────────────────────

export const SubmitShiftChangeSchema = z.object({
	employeeShiftId: z.string().describe("ID of the employee's own shift to swap away"),
	workingShiftId: z.string().optional().describe("Target shift type to swap to (optional)"),
	swapWithEmployeeId: z.string().optional().describe("ID of the employee to swap with (optional)"),
	swapWithShiftId: z
		.string()
		.optional()
		.describe("ID of that employee's specific shift (optional)"),
});

export const RejectShiftChangeSchema = z.object({
	rejectReason: z.string().min(5).max(500).describe("Reason for rejection (5–500 characters)"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LocationInput = z.infer<typeof LocationSchema>;
export type GetAttendanceInput = z.infer<typeof GetAttendanceSchema>;
export type CreateShiftInput = z.infer<typeof CreateShiftSchema>;
export type UpdateShiftInput = z.infer<typeof UpdateShiftSchema>;
export type AssignScheduleInput = z.infer<typeof AssignScheduleSchema>;
export type OverrideScheduleInput = z.infer<typeof OverrideScheduleSchema>;
export type SubmitShiftChangeInput = z.infer<typeof SubmitShiftChangeSchema>;
export type RejectShiftChangeInput = z.infer<typeof RejectShiftChangeSchema>;
