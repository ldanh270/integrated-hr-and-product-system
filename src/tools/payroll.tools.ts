import { mcpServer } from "../mcp.js";
import { z } from "zod";
import { payrollService } from "../services/payroll.service.js";
import { buildSuccess, buildError } from "../utils/tool-response.js";
import { requireSession } from "../utils/session-guard.js";

export const registerPayrollTools = () => {
	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP A — SALARY COMPONENTS (5 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"salary_component_list",
		"Get a list of all salary components. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.listSalaryComponents(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch salary components", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_component_create",
		"Create a new salary component (addition or deduction). Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			name: z.string().min(1).describe('Name of the component (e.g. "Lunch Allowance")'),
			type: z.enum(["addition", "deduction"]).describe("Component type"),
			valueType: z.enum(["currency", "number", "percentage"]).describe("Value type format"),
			formula: z.string().min(1).describe("Calculation formula"),
			description: z.string().optional().describe("Description of the component"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.createSalaryComponent(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create salary component", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_component_update",
		"Update an existing salary component. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			componentId: z.string().describe("ID of the salary component to update"),
			name: z.string().min(1).optional().describe("Name of the component"),
			type: z.enum(["addition", "deduction"]).optional().describe("Component type"),
			valueType: z
				.enum(["currency", "number", "percentage"])
				.optional()
				.describe("Value type format"),
			formula: z.string().min(1).optional().describe("Calculation formula"),
			description: z.string().optional().describe("Description of the component"),
		},
		async ({ sessionId, componentId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.updateSalaryComponent(
					session.jwt,
					componentId,
					Object.keys(payload).length > 0 ? payload : {},
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update salary component", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_component_delete",
		"Delete a salary component. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			componentId: z.string().describe("ID of the salary component to delete"),
		},
		async ({ sessionId, componentId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.deleteSalaryComponent(session.jwt, componentId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to delete salary component", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_component_validate_formula",
		"Validate the correctness of a salary formula. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			formula: z.string().min(1).describe("The formula to validate"),
		},
		async ({ sessionId, formula }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.validateFormula(session.jwt, { formula });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to validate formula", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP B — SALARY VARIABLES (4 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"salary_variable_list",
		"Get a list of all salary variables. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.listSalaryVariables(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch salary variables", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_variable_get",
		"Get the details of a single salary variable. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			variableId: z.string().describe("ID of the salary variable"),
		},
		async ({ sessionId, variableId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getSalaryVariable(session.jwt, variableId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch salary variable", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_variable_create",
		"Create a new salary variable. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			code: z.string().min(1).describe('Variable code (e.g. "TAX_RATE")'),
			name: z.string().min(1).describe("Name of the variable"),
			value: z.number().describe("Numeric value of the variable"),
			description: z.string().optional().describe("Description"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.createSalaryVariable(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create salary variable", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_variable_update",
		"Update an existing salary variable. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			variableId: z.string().describe("ID of the salary variable to update"),
			code: z.string().min(1).optional().describe("Variable code"),
			name: z.string().min(1).optional().describe("Name of the variable"),
			value: z.number().optional().describe("Numeric value of the variable"),
			description: z.string().optional().describe("Description"),
		},
		async ({ sessionId, variableId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.updateSalaryVariable(
					session.jwt,
					variableId,
					Object.keys(payload).length > 0 ? payload : {},
				);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update salary variable", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP C — PAYSLIP TEMPLATES (4 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"payslip_template_list",
		"Get a list of all payslip templates. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.listPayslipTemplates(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch payslip templates", error.message);
			}
		},
	);

	mcpServer.tool(
		"payslip_template_create",
		"Create a new payslip template. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			name: z.string().min(1).describe("Name of the template"),
			componentIds: z.string().describe("Comma-separated list of component IDs to include"),
			description: z.string().optional().describe("Description"),
		},
		async ({ sessionId, name, componentIds, description }) => {
			try {
				const session = requireSession(sessionId);
				const componentIdsArray = componentIds
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
				const data = await payrollService.createPayslipTemplate(session.jwt, {
					name,
					componentIds: componentIdsArray,
					...(description && { description }),
				});
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to create payslip template", error.message);
			}
		},
	);

	mcpServer.tool(
		"payslip_template_update",
		"Update an existing payslip template. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			templateId: z.string().describe("ID of the payslip template to update"),
			name: z.string().min(1).optional().describe("Name of the template"),
			componentIds: z
				.string()
				.optional()
				.describe("Comma-separated list of component IDs to include"),
			description: z.string().optional().describe("Description"),
		},
		async ({ sessionId, templateId, name, componentIds, description }) => {
			try {
				const session = requireSession(sessionId);
				const payload: any = {};
				if (name !== undefined) payload.name = name;
				if (description !== undefined) payload.description = description;
				if (componentIds !== undefined) {
					payload.componentIds = componentIds
						.split(",")
						.map((s) => s.trim())
						.filter((s) => s.length > 0);
				}
				const data = await payrollService.updatePayslipTemplate(session.jwt, templateId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update payslip template", error.message);
			}
		},
	);

	mcpServer.tool(
		"payslip_template_delete",
		"Delete a payslip template. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			templateId: z.string().describe("ID of the payslip template to delete"),
		},
		async ({ sessionId, templateId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.deletePayslipTemplate(session.jwt, templateId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to delete payslip template", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP D — EMPLOYEE SALARY CONFIG (3 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"salary_config_get",
		"Get the current salary configuration of a specific employee. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getEmployeeSalaryConfig(session.jwt, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee salary config", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_config_get_history",
		"Get the history of salary configurations for a specific employee. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getEmployeeSalaryConfigHistory(session.jwt, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee salary config history", error.message);
			}
		},
	);

	mcpServer.tool(
		"salary_config_set",
		"Set a new salary configuration for an employee. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
			templateId: z.string().describe("ID of the payslip template to apply"),
			baseSalary: z.number().positive().describe("Base salary amount"),
			effectiveFrom: z.string().datetime().describe("Effective from date (ISO 8601)"),
			effectiveTo: z.string().datetime().optional().describe("Effective to date (ISO 8601)"),
			note: z.string().optional().describe("Notes for this configuration change"),
		},
		async ({ sessionId, employeeId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.setEmployeeSalaryConfig(session.jwt, employeeId, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to set employee salary config", error.message);
			}
		},
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// GROUP E — PAYROLLS & PAYSLIPS (7 tools)
	// ═══════════════════════════════════════════════════════════════════════════

	mcpServer.tool(
		"payroll_get_settings",
		"Get current payroll automated generation schedule settings. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getPayrollSettings(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch payroll settings", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_update_settings",
		"Update payroll automated generation schedule settings. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			triggerDay: z
				.number()
				.int()
				.min(1)
				.max(31)
				.describe("Day of the month to trigger payroll generation"),
			triggerHour: z.number().int().min(0).max(23).describe("Hour to trigger payroll generation"),
			triggerMinute: z
				.number()
				.int()
				.min(0)
				.max(59)
				.describe("Minute to trigger payroll generation"),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.updatePayrollSettings(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to update payroll settings", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_generate",
		"Manually trigger the generation of a new payroll period. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			periodMonth: z.number().int().min(1).max(12).describe("Month of the payroll period (1-12)"),
			periodYear: z.number().int().min(2000).describe("Year of the payroll period (e.g. 2026)"),
			name: z.string().min(1).describe('Name of this payroll run (e.g. "Bảng lương tháng 6/2026")'),
		},
		async ({ sessionId, ...payload }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.generatePayroll(session.jwt, payload);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to generate payroll", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_list",
		"Get a list of generated payrolls. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.listPayrolls(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch payrolls", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_get",
		"Get details of a specific payroll run including all payslips. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			payrollId: z.string().describe("ID of the payroll run"),
		},
		async ({ sessionId, payrollId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getPayroll(session.jwt, payrollId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch payroll details", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_approve",
		"Approve a payroll run. Restricted to Admin and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			payrollId: z.string().describe("ID of the payroll run to approve"),
		},
		async ({ sessionId, payrollId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.approvePayroll(session.jwt, payrollId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to approve payroll", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_reject",
		"Reject a payroll run with a reason. Restricted to Admin and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			payrollId: z.string().describe("ID of the payroll run to reject"),
			rejectReason: z.string().min(1).describe("Reason for rejection"),
		},
		async ({ sessionId, payrollId, rejectReason }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.rejectPayroll(session.jwt, payrollId, { rejectReason });
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to reject payroll", error.message);
			}
		},
	);

	// Note: These methods are mapped based on the detailed endpoint URLs
	mcpServer.tool(
		"payroll_get_payslip",
		"Get a specific payslip for an employee from a specific payroll run. Restricted to Admin, HR Manager, and General Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			payrollId: z.string().describe("ID of the payroll run"),
			employeeId: z.string().describe("ID of the employee"),
		},
		async ({ sessionId, payrollId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getPayslip(session.jwt, payrollId, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch payslip", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_get_employee_payslips",
		"Get all historical payslips for a specific employee across all payroll runs. Restricted to Admin and HR Manager.",
		{
			sessionId: z.string().describe("Active session ID"),
			employeeId: z.string().describe("ID of the employee"),
		},
		async ({ sessionId, employeeId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getEmployeePayslips(session.jwt, employeeId);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch employee payslips", error.message);
			}
		},
	);

	mcpServer.tool(
		"payroll_get_my_payslips",
		"Get all payslips belonging to the currently authenticated employee. Available to all roles.",
		{
			sessionId: z.string().describe("Active session ID"),
		},
		async ({ sessionId }) => {
			try {
				const session = requireSession(sessionId);
				const data = await payrollService.getMyPayslips(session.jwt);
				return buildSuccess(data);
			} catch (error: any) {
				return buildError("Failed to fetch my payslips", error.message);
			}
		},
	);
};
