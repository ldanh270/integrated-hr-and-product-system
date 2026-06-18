import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { sessionManager } from "../session/session.manager.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerAuthTools = () => {
	// 1. Tool: login
	mcpServer.tool(
		"login",
		"Login to HRP system to obtain a sessionId. You must use this sessionId for all subsequent requests.",
		{
			username: z.string().describe("Username or Email of the employee"),
			password: z.string().describe("Password"),
		},
		async ({ username, password }) => {
			try {
				const result = await authService.login({ username, password });

				// Save JWT token into SessionManager
				const sessionId = sessionManager.create({
					jwt: result.data.token,
					role: result.data.employee.role,
					employeeId: result.data.employee.id,
				});

				return buildSuccess({
					message: "Login successful",
					sessionId,
					employee: {
						id: result.data.employee.id,
						fullName: result.data.employee.fullName,
						role: result.data.employee.role,
					},
					instruction:
						"CRITICAL: Keep this sessionId and pass it as an argument to all other tools.",
				});
			} catch (error: any) {
				return buildError("Login failed", error.message);
			}
		},
	);

	// 2. Tool: logout
	mcpServer.tool(
		"logout",
		"Logout from HRP system and invalidate the sessionId.",
		{
			sessionId: z.string().describe("The active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				await authService.logout(session.jwt);

				sessionManager.delete(sessionId);

				return buildSuccess({
					message: "Logout successful. Session invalidated.",
				});
			} catch (error: any) {
				return buildError("Logout failed", error.message);
			}
		},
	);
};
