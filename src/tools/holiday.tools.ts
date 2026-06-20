import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { holidayService } from "../services/holiday.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerHolidayTools = () => {
	mcpServer.tool(
		"holiday_list",
		"List all holidays. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.list(session);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list holidays", error.message);
			}
		},
	);

	mcpServer.tool(
		"holiday_get",
		"Get details of a specific holiday.",
		{
			sessionId: z.string().describe("Active session ID"),
			holidayId: z.string().describe("ID of the holiday"),
		},
		async ({ sessionId, holidayId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.getOne(session, holidayId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch holiday", error.message);
			}
		},
	);

	mcpServer.tool(
		"holiday_check",
		"Check if a specific date is a holiday.",
		{
			sessionId: z.string().describe("Active session ID"),
			date: z.string().describe("Date to check (YYYY-MM-DD)"),
		},
		async ({ sessionId, date }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.check(session, date);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to check holiday", error.message);
			}
		},
	);

	mcpServer.tool(
		"holiday_create",
		"Create a new holiday.",
		{
			sessionId: z.string().describe("Active session ID"),
			name: z.string().min(1).describe("Holiday name"),
			startDate: z.string().datetime().describe("Start date (ISO 8601)"),
			endDate: z.string().datetime().describe("End date (ISO 8601)"),
			type: z.enum(["public", "company", "other"]).describe("Type of holiday"),
			description: z.string().optional(),
			isActive: z.boolean().optional(),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.create(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create holiday", error.message);
			}
		},
	);

	mcpServer.tool(
		"holiday_update",
		"Update a holiday.",
		{
			sessionId: z.string().describe("Active session ID"),
			holidayId: z.string().describe("Holiday ID"),
			name: z.string().optional(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
			type: z.enum(["public", "company", "other"]).optional(),
			description: z.string().optional(),
			isActive: z.boolean().optional(),
		},
		async ({ sessionId, holidayId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.update(session, holidayId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update holiday", error.message);
			}
		},
	);

	mcpServer.tool(
		"holiday_delete",
		"Delete a holiday.",
		{
			sessionId: z.string().describe("Active session ID"),
			holidayId: z.string().describe("Holiday ID"),
		},
		async ({ sessionId, holidayId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await holidayService.delete(session, holidayId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to delete holiday", error.message);
			}
		},
	);
};
