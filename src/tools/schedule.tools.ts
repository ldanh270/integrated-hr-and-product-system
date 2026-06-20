import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { scheduleService } from "../services/schedule.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerScheduleTools = () => {
	mcpServer.tool(
		"schedule_get_mine",
		"Get your own shift schedule.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.getMySchedule(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch my schedule", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_list_mine",
		"List all your historical and future schedules.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.listMySchedules(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list my schedules", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_get_employee",
		"Get schedule for a specific employee. Restricted to Admin, HR Manager, GM.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("Employee ID"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.getEmployeeSchedule(session.jwt, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee schedule", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_list_employee",
		"List all historical and future schedules for a specific employee.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("Employee ID"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.listEmployeeSchedules(session.jwt, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list employee schedules", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_assign",
		"Manually assign a schedule to employees for a specific date range.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeIds: z.array(z.string()).describe("Array of employee IDs"),
			shiftId: z.string().describe("Shift ID to assign"),
			startDate: z.string().describe("Start date (YYYY-MM-DD)"),
			endDate: z.string().describe("End date (YYYY-MM-DD)"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.assign(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to assign schedule", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_override",
		"Override a single day's shift for an employee.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("Employee ID"),
			date: z.string().describe("Date to override (YYYY-MM-DD)"),
			shiftId: z.string().describe("New Shift ID"),
			note: z.string().optional().describe("Note for override"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.override(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to override shift", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_generate_preview",
		"Preview the generated schedules based on weekly templates.",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().describe("Start date (YYYY-MM-DD)"),
			endDate: z.string().describe("End date (YYYY-MM-DD)"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.previewGenerate(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to preview generated schedule", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_generate",
		"Generate schedules for all employees based on their assigned weekly templates.",
		{
			sessionId: z.string().describe("Active session ID"),
			startDate: z.string().describe("Start date (YYYY-MM-DD)"),
			endDate: z.string().describe("End date (YYYY-MM-DD)"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.generate(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to generate schedule", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_get_settings",
		"Get auto-generation settings for schedules.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.getSettings(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch schedule settings", error.message);
			}
		},
	);

	mcpServer.tool(
		"schedule_update_settings",
		"Update auto-generation settings for schedules.",
		{
			sessionId: z.string().describe("Active session ID"),
			triggerDayOfWeek: z
				.number()
				.int()
				.min(0)
				.max(6)
				.describe("Day of week to trigger (0=Sun, 6=Sat)"),
			triggerHour: z.number().int().min(0).max(23).optional(),
			triggerMinute: z.number().int().min(0).max(59).optional(),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await scheduleService.updateSettings(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update schedule settings", error.message);
			}
		},
	);
};
