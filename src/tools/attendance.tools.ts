import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { attendanceService } from "../services/attendance.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerAttendanceTools = () => {
	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP A — ATTENDANCE (Chấm công)
	// ═══════════════════════════════════════════════════════════════════════════

	// 1. attendance_check_in
	mcpServer.tool(
		"attendance_check_in",
		"Check in to work for the authenticated employee. Records the check-in time and location.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			lat: z.number().min(-90).max(90).describe("Current GPS latitude (-90 to 90)"),
			lng: z.number().min(-180).max(180).describe("Current GPS longitude (-180 to 180)"),
		},
		async ({ sessionId, lat, lng }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.checkIn(session.jwt, { lat, lng });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Check-in failed", error.message);
			}
		},
	);

	// 2. attendance_check_out
	mcpServer.tool(
		"attendance_check_out",
		"Check out from work for the authenticated employee. Records the check-out time, calculates total work hours, overtime, and early leave.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			lat: z.number().min(-90).max(90).describe("Current GPS latitude (-90 to 90)"),
			lng: z.number().min(-180).max(180).describe("Current GPS longitude (-180 to 180)"),
		},
		async ({ sessionId, lat, lng }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.checkOut(session.jwt, { lat, lng });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Check-out failed", error.message);
			}
		},
	);

	// 3. attendance_scan
	mcpServer.tool(
		"attendance_scan",
		"Smart attendance scan: automatically performs check-in if no record exists today, or check-out if already checked in. Returns 409 if both check-in and check-out are already recorded.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			lat: z.number().min(-90).max(90).describe("Current GPS latitude (-90 to 90)"),
			lng: z.number().min(-180).max(180).describe("Current GPS longitude (-180 to 180)"),
		},
		async ({ sessionId, lat, lng }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.scan(session.jwt, { lat, lng });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Attendance scan failed", error.message);
			}
		},
	);

	// 4. attendance_get_history
	mcpServer.tool(
		"attendance_get_history",
		"Get attendance history records. Employees can only see their own records. Admins, HR Managers, and General Managers can filter by any employeeId.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			startDate: z
				.string()
				.datetime()
				.optional()
				.describe("Filter from this date (ISO 8601, e.g. 2026-06-01T00:00:00Z)"),
			endDate: z
				.string()
				.datetime()
				.optional()
				.describe("Filter until this date (ISO 8601, e.g. 2026-06-30T23:59:59Z)"),
			employeeId: z
				.string()
				.optional()
				.describe("Filter by employee ID (Admin/HR only — ignored for regular employees)"),
			status: z
				.enum(["on_time", "late", "early_leave", "absent", "overtime"])
				.optional()
				.describe("Filter by attendance status"),
		},
		async ({ sessionId, startDate, endDate, employeeId, status }) => {
			try {
				const session = requireSession(sessionId);
				const params = {
					...(startDate && { startDate }),
					...(endDate && { endDate }),
					...(employeeId && { employeeId }),
					...(status && { status }),
				};
				const data = await attendanceService.getHistory(session.jwt, params);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch attendance history", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP B — SHIFTS (Ca làm việc)
	// ═══════════════════════════════════════════════════════════════════════════

	// 5. shift_list
	mcpServer.tool(
		"shift_list",
		"List all working shifts defined in the system. Available to all authenticated employees.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.listShifts(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch shifts", error.message);
			}
		},
	);

	// 6. shift_get
	mcpServer.tool(
		"shift_get",
		"Get the details of a specific working shift by its ID.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			shiftId: z.string().describe("ID of the working shift to retrieve"),
		},
		async ({ sessionId, shiftId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.getShift(session.jwt, shiftId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch shift", error.message);
			}
		},
	);

	// 7. shift_create
	mcpServer.tool(
		"shift_create",
		"Create a new working shift. Restricted to Admin, HR Manager, or General Manager roles. Times are expressed as minutes from midnight (e.g. 480 = 08:00, 1020 = 17:00).",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			name: z.string().min(1).describe('Name of the shift (e.g. "Morning Shift")'),
			startTime: z
				.number()
				.int()
				.min(0)
				.max(1439)
				.describe("Shift start time in minutes from midnight (e.g. 480 = 08:00)"),
			endTime: z
				.number()
				.int()
				.min(0)
				.max(1439)
				.describe("Shift end time in minutes from midnight (e.g. 1020 = 17:00)"),
		},
		async ({ sessionId, name, startTime, endTime }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.createShift(session.jwt, { name, startTime, endTime });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create shift", error.message);
			}
		},
	);

	// 8. shift_update
	mcpServer.tool(
		"shift_update",
		"Update an existing working shift. Restricted to Admin, HR Manager, or General Manager roles. Provide only the fields you want to change.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			shiftId: z.string().describe("ID of the shift to update"),
			name: z.string().min(1).optional().describe("New name for the shift"),
			startTime: z
				.number()
				.int()
				.min(0)
				.max(1439)
				.optional()
				.describe("New start time in minutes from midnight"),
			endTime: z
				.number()
				.int()
				.min(0)
				.max(1439)
				.optional()
				.describe("New end time in minutes from midnight"),
		},
		async ({ sessionId, shiftId, name, startTime, endTime }) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					...(name !== undefined && { name }),
					...(startTime !== undefined && { startTime }),
					...(endTime !== undefined && { endTime }),
				};
				const data = await attendanceService.updateShift(session.jwt, shiftId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update shift", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP C — SCHEDULES (Lịch ca)
	// ═══════════════════════════════════════════════════════════════════════════

	// 9. schedule_get_mine
	mcpServer.tool(
		"schedule_get_mine",
		"Get the authenticated employee's currently assigned working shift schedule.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.getMySchedule(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch current schedule", error.message);
			}
		},
	);

	// 10. schedule_get_mine_history
	mcpServer.tool(
		"schedule_get_mine_history",
		"Get the full schedule history for the authenticated employee, showing all past and present shift assignments.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.getMyScheduleHistory(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch schedule history", error.message);
			}
		},
	);

	// 11. schedule_assign
	mcpServer.tool(
		"schedule_assign",
		"Assign a working shift to an employee starting from a given effective date. Restricted to Admin, HR Manager, or General Manager.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			employeeId: z.string().describe("ID of the employee to assign the shift to"),
			workingShiftId: z.string().describe("ID of the working shift to assign"),
			effectiveDate: z
				.string()
				.datetime()
				.describe(
					"Date from which this schedule takes effect (ISO 8601, e.g. 2026-07-01T00:00:00Z)",
				),
		},
		async ({ sessionId, employeeId, workingShiftId, effectiveDate }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.assignSchedule(session.jwt, {
					employeeId,
					workingShiftId,
					effectiveDate,
				});
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to assign schedule", error.message);
			}
		},
	);

	// 12. schedule_override
	mcpServer.tool(
		"schedule_override",
		"Override an employee's assigned shift for a specific single date. Restricted to Admin, HR Manager, or General Manager.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			employeeId: z.string().describe("ID of the employee"),
			workingShiftId: z.string().describe("ID of the working shift to use on the override date"),
			date: z
				.string()
				.datetime()
				.describe("The specific date to override (ISO 8601, e.g. 2026-06-20T00:00:00Z)"),
		},
		async ({ sessionId, employeeId, workingShiftId, date }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.overrideSchedule(session.jwt, {
					employeeId,
					workingShiftId,
					date,
				});
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to override schedule", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP D — SHIFT CHANGE REQUESTS (Yêu cầu đổi ca)
	// ═══════════════════════════════════════════════════════════════════════════

	// 13. shift_change_list_mine
	mcpServer.tool(
		"shift_change_list_mine",
		"List the authenticated employee's own shift change requests, including their current status (pending, approved, rejected, cancelled).",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.getMyShiftChangeRequests(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch shift change requests", error.message);
			}
		},
	);

	// 14. shift_change_submit
	mcpServer.tool(
		"shift_change_submit",
		"Submit a shift change request for the authenticated employee. Optionally specify the target shift type or a specific employee to swap with.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			employeeShiftId: z
				.string()
				.describe("ID of the employee's own current shift assignment to swap away"),
			workingShiftId: z
				.string()
				.optional()
				.describe("ID of the target working shift type to swap to (optional)"),
			swapWithEmployeeId: z
				.string()
				.optional()
				.describe("ID of the specific employee to swap shifts with (optional)"),
			swapWithShiftId: z
				.string()
				.optional()
				.describe("ID of that employee's specific shift to swap with (optional)"),
		},
		async ({ sessionId, employeeShiftId, workingShiftId, swapWithEmployeeId, swapWithShiftId }) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					employeeShiftId,
					...(workingShiftId && { workingShiftId }),
					...(swapWithEmployeeId && { swapWithEmployeeId }),
					...(swapWithShiftId && { swapWithShiftId }),
				};
				const data = await attendanceService.submitShiftChangeRequest(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to submit shift change request", error.message);
			}
		},
	);

	// 15. shift_change_approve
	mcpServer.tool(
		"shift_change_approve",
		"Approve a pending shift change request. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			requestId: z.string().describe("ID of the shift change request to approve"),
		},
		async ({ sessionId, requestId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.approveShiftChangeRequest(session.jwt, requestId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to approve shift change request", error.message);
			}
		},
	);

	// 16. shift_change_reject
	mcpServer.tool(
		"shift_change_reject",
		"Reject a pending shift change request with a mandatory reason. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID obtained from login"),
			requestId: z.string().describe("ID of the shift change request to reject"),
			rejectReason: z.string().min(5).max(500).describe("Reason for rejection (5–500 characters)"),
		},
		async ({ sessionId, requestId, rejectReason }) => {
			try {
				const session = requireSession(sessionId);
				const data = await attendanceService.rejectShiftChangeRequest(
					session.jwt,
					requestId,
					rejectReason,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to reject shift change request", error.message);
			}
		},
	);
};
