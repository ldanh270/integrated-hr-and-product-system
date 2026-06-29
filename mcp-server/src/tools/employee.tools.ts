import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { employeeService } from "../services/employee.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";
import { EMPLOYEE_STATUSES } from "../constants/entities/employee.config.js";

export const registerEmployeeTools = () => {
	mcpServer.tool(
		"employee_list",
		"Get a list of employees. Can be filtered by search term, role, or status.",
		{
			sessionId: z.string().describe("Active session ID"),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().optional(),
			search: z.string().optional().describe("Search term for name or email"),
			role: z.string().optional().describe("Filter by employee role"),
			status: z.enum(EMPLOYEE_STATUSES).optional(),
		},
		async ({ sessionId, ...params }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.list(
					session,
					Object.keys(params).length > 0 ? params : undefined,
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list employees", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_list_approvers",
		"Get a list of employees who can approve applications (Team Leader, HR Manager, Admin, GM).",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.listApprovers(session);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to list approvers", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_get",
		"Get details of a specific employee.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.getOne(session, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_create",
		"Create a new employee. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			email: z.string().email().describe("Employee's email address"),
			firstName: z.string().min(1).describe("First name"),
			lastName: z.string().min(1).describe("Last name"),
			role: z.string().describe("Employee's role ID or role name"),
			joinDate: z.string().datetime().optional().describe("Join date (ISO 8601)"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.create(session, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create employee", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_update",
		"Update employee details. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee to update"),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			role: z.string().optional(),
		},
		async ({ sessionId, employeeId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.update(session, employeeId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update employee", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_update_status",
		"Update employee's status. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
			status: z.enum(EMPLOYEE_STATUSES),
			reason: z.string().optional().describe("Reason for status change"),
		},
		async ({ sessionId, employeeId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.updateStatus(session, employeeId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update employee status", error.message);
			}
		},
	);

	mcpServer.tool(
		"employee_delete",
		"Delete an employee. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee to delete"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await employeeService.delete(session, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to delete employee", error.message);
			}
		},
	);
};
