import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { shiftService } from "../services/shift.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerShiftTools = () => {
	mcpServer.tool(
		"shift_list",
		"Get a list of all shifts. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await shiftService.list(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list shifts", error.message);
			}
		},
	);

	mcpServer.tool(
		"shift_get",
		"Get details of a specific shift.",
		{
			sessionId: z.string().describe("Active session ID"),
			shiftId: z.string().describe("ID of the shift"),
		},
		async ({ sessionId, shiftId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await shiftService.getOne(session.jwt, shiftId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch shift", error.message);
			}
		},
	);

	mcpServer.tool(
		"shift_create",
		"Create a new shift. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			name: z.string().min(1).describe("Shift name"),
			startTime: z.string().describe("Start time (HH:mm)"),
			endTime: z.string().describe("End time (HH:mm)"),
			color: z.string().optional().describe("Hex color code for UI"),
			isActive: z.boolean().optional(),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await shiftService.create(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create shift", error.message);
			}
		},
	);

	mcpServer.tool(
		"shift_update",
		"Update an existing shift. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			shiftId: z.string().describe("ID of the shift to update"),
			name: z.string().optional(),
			startTime: z.string().optional(),
			endTime: z.string().optional(),
			color: z.string().optional(),
			isActive: z.boolean().optional(),
		},
		async ({ sessionId, shiftId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await shiftService.update(session.jwt, shiftId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update shift", error.message);
			}
		},
	);

	mcpServer.tool(
		"shift_delete",
		"Delete a shift. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			shiftId: z.string().describe("ID of the shift to delete"),
		},
		async ({ sessionId, shiftId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await shiftService.delete(session.jwt, shiftId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to delete shift", error.message);
			}
		},
	);
};
