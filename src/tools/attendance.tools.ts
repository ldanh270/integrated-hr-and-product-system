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


};
