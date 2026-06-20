import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { applicationService } from "../services/application.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerApplicationTools = () => {
	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP A — CREATE APPLICATION (7 tools, 1 tool per type)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"application_create_leave",
		"Create a leave application (đơn xin nghỉ phép).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			endDate: z.string().datetime().describe("End date (ISO 8601)"),
			leaveType: z.string().describe("Type of leave (e.g., annual_leave, unpaid_leave)"),
			regimeType: z.string().describe("Regime type for leave"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z
				.string()
				.optional()
				.describe("ID of employee to assign tasks to while on leave"),
		},
		async ({
			sessionId,
			startDate,
			endDate,
			leaveType,
			regimeType,
			reason,
			note,
			assignedToId,
		}) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "leave" as const,
					startDate,
					endDate,
					reason,
					note,
					assignedToId,
					detail: { leaveType, regimeType },
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create leave application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_overtime",
		"Create an overtime application (đơn làm thêm giờ).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			employeeShiftId: z.string().describe("ID of the employee shift"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({ sessionId, startDate, employeeShiftId, reason, note, assignedToId }) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "overtime" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: { employeeShiftId },
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create overtime application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_wfh",
		"Create a work from home application (đơn làm việc tại nhà).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			location: z.string().max(255).optional().describe("Work location"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({ sessionId, startDate, location, reason, note, assignedToId }) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "work_from_home" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: { ...(location && { location }) },
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create WFH application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_shift_swap",
		"Create a shift swap application (đơn đổi ca).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			employeeShiftId: z.string().describe("ID of your current shift"),
			workingShiftId: z.string().optional().describe("ID of the new working shift"),
			swapWithEmployeeId: z.string().optional().describe("ID of the employee to swap with"),
			swapWithShiftId: z.string().optional().describe("ID of the shift to swap with"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({
			sessionId,
			startDate,
			employeeShiftId,
			workingShiftId,
			swapWithEmployeeId,
			swapWithShiftId,
			reason,
			note,
			assignedToId,
		}) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "shift_swap" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: {
						employeeShiftId,
						...(workingShiftId && { workingShiftId }),
						...(swapWithEmployeeId && { swapWithEmployeeId }),
						...(swapWithShiftId && { swapWithShiftId }),
					},
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create shift swap application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_business_trip",
		"Create a business trip application (đơn công tác).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			location: z.string().min(2).max(255).describe("Trip location"),
			purpose: z.string().max(500).optional().describe("Purpose of the trip"),
			budget: z.number().optional().describe("Estimated budget"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({ sessionId, startDate, location, purpose, budget, reason, note, assignedToId }) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "business_trip" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: {
						location,
						...(purpose && { purpose }),
						...(budget !== undefined && { budget }),
					},
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create business trip application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_late_early",
		"Create an application for arriving late or leaving early (đơn đi muộn/về sớm).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			employeeShiftId: z.string().describe("ID of the employee shift"),
			durationMinutes: z.number().int().min(1).max(480).describe("Duration in minutes"),
			isLate: z.boolean().describe("True for arriving late, False for leaving early"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({
			sessionId,
			startDate,
			employeeShiftId,
			durationMinutes,
			isLate,
			reason,
			note,
			assignedToId,
		}) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "late_early" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: { employeeShiftId, durationMinutes, isLate },
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create late/early application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_create_regime",
		"Create a regime application, e.g., maternity, sick child (đơn chế độ).",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			regimeType: z.string().describe("Type of regime"),
			reducedMinutesPerDay: z.number().int().min(0).max(480).describe("Reduced minutes per day"),
			applyToStart: z.boolean().optional().describe("Apply to start of shift"),
			applyToEnd: z.boolean().optional().describe("Apply to end of shift"),
			documentUrl: z.string().url().optional().describe("URL to supporting document"),
			reason: z.string().min(5).max(500).optional().describe("Reason for application"),
			note: z.string().max(1000).optional().describe("Additional notes"),
			assignedToId: z.string().optional().describe("ID of employee to assign tasks to"),
		},
		async ({
			sessionId,
			startDate,
			regimeType,
			reducedMinutesPerDay,
			applyToStart,
			applyToEnd,
			documentUrl,
			reason,
			note,
			assignedToId,
		}) => {
			try {
				const session = requireSession(sessionId);
				const payload = {
					type: "regime" as const,
					startDate,
					reason,
					note,
					assignedToId,
					detail: {
						regimeType,
						reducedMinutesPerDay,
						...(applyToStart !== undefined && { applyToStart }),
						...(applyToEnd !== undefined && { applyToEnd }),
						...(documentUrl && { documentUrl }),
					},
				};
				const data = await applicationService.createApplication(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create regime application", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP B — MANAGE APPLICATION (7 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"application_get_mine",
		"Get a list of your own applications.",
		{
			sessionId: z.string().describe("Active session ID"),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().optional(),
			type: z
				.enum([
					"leave",
					"overtime",
					"work_from_home",
					"shift_swap",
					"business_trip",
					"late_early",
					"regime",
				])
				.optional(),
			status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
		},
		async ({ sessionId, ...params }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.getMyApplications(
					session,
					Object.keys(params).length > 0 ? params : undefined,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch my applications", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_get",
		"Get details of a specific application.",
		{
			sessionId: z.string().describe("Active session ID"),
			applicationId: z.string().describe("ID of the application"),
		},
		async ({ sessionId, applicationId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.getApplication(session, applicationId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_cancel",
		"Cancel your own pending application.",
		{
			sessionId: z.string().describe("Active session ID"),
			applicationId: z.string().describe("ID of the application to cancel"),
			reason: z.string().optional().describe("Reason for cancellation"),
		},
		async ({ sessionId, applicationId, reason }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.cancelApplication(session, applicationId, reason);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to cancel application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_list_all",
		"Get a list of all applications across the company. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID"),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().optional(),
			type: z
				.enum([
					"leave",
					"overtime",
					"work_from_home",
					"shift_swap",
					"business_trip",
					"late_early",
					"regime",
				])
				.optional(),
			status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
			employeeId: z.string().optional().describe("Filter by specific employee ID"),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
		},
		async ({ sessionId, ...params }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.listAllApplications(
					session,
					Object.keys(params).length > 0 ? params : undefined,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list applications", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_list_by_employee",
		"Get applications of a specific employee. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().optional(),
			type: z
				.enum([
					"leave",
					"overtime",
					"work_from_home",
					"shift_swap",
					"business_trip",
					"late_early",
					"regime",
				])
				.optional(),
			status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
		},
		async ({ sessionId, employeeId, ...params }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.listApplicationsByEmployee(
					session,
					employeeId,
					Object.keys(params).length > 0 ? params : undefined,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee applications", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_approve",
		"Approve an application. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID"),
			applicationId: z.string().describe("ID of the application to approve"),
		},
		async ({ sessionId, applicationId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.approveApplication(session, applicationId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to approve application", error.message);
			}
		},
	);

	mcpServer.tool(
		"application_reject",
		"Reject an application with a reason. Restricted to Admin, HR Manager, General Manager, or Team Leader.",
		{
			sessionId: z.string().describe("Active session ID"),
			applicationId: z.string().describe("ID of the application to reject"),
			rejectReason: z.string().min(5).max(500).describe("Reason for rejection"),
		},
		async ({ sessionId, applicationId, rejectReason }) => {
			try {
				const session = requireSession(sessionId);
				const data = await applicationService.rejectApplication(
					session,
					applicationId,
					rejectReason,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to reject application", error.message);
			}
		},
	);
};
