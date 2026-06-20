import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { profileService } from "../services/profile.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerProfileTools = () => {
	mcpServer.tool(
		"profile_get_me",
		"Get the authenticated user's profile.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await profileService.getMe(session);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch profile", error.message);
			}
		},
	);

	mcpServer.tool(
		"profile_update_me",
		"Update the authenticated user's profile.",
		{
			sessionId: z.string().describe("Active session ID"),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			phone: z.string().optional(),
			address: z.string().optional(),
			bankName: z.string().optional(),
			bankAccountNumber: z.string().optional(),
			taxNumber: z.string().optional(),
			emergencyContactName: z.string().optional(),
			emergencyContactPhone: z.string().optional(),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await profileService.updateMe(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update profile", error.message);
			}
		},
	);

	mcpServer.tool(
		"profile_change_password",
		"Change the authenticated user's password.",
		{
			sessionId: z.string().describe("Active session ID"),
			currentPassword: z.string().optional().describe("Current password (required if already set)"),
			newPassword: z.string().min(6).describe("New password"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await profileService.changePassword(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to change password", error.message);
			}
		},
	);
};
