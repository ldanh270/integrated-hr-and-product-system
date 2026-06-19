import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateSalaryComponentInput,
	UpdateSalaryComponentInput,
	ValidateFormulaInput,
	CreateSalaryVariableInput,
	UpdateSalaryVariableInput,
	CreatePayslipTemplateInput,
	UpdatePayslipTemplateInput,
	SetSalaryConfigInput,
	GeneratePayrollInput,
	UpdatePayrollSettingsInput,
	RejectPayrollInput,
} from "../schemas/payroll.schema.js";

export class PayrollService {
	private client(jwt: string) {
		return createAuthedClient(jwt);
	}

	private handleError(error: any, fallback: string): never {
		if (error.response) {
			throw new Error(
				error.response.data?.message || error.response.data?.error?.message || fallback,
			);
		}
		throw new Error(`Connection error: ${error.message}`);
	}

	// ─── Salary Components ────────────────────────────────────────────────────────

	async listSalaryComponents(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENTS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch salary components");
		}
	}

	async createSalaryComponent(jwt: string, data: CreateSalaryComponentInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENTS,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create salary component");
		}
	}

	async updateSalaryComponent(jwt: string, id: string, data: UpdateSalaryComponentInput) {
		try {
			const res = await this.client(jwt).put(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update salary component");
		}
	}

	async deleteSalaryComponent(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete salary component");
		}
	}

	async validateFormula(jwt: string, data: ValidateFormulaInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_VALIDATE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to validate formula");
		}
	}

	// ─── Salary Variables ─────────────────────────────────────────────────────────

	async listSalaryVariables(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLES);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch salary variables");
		}
	}

	async getSalaryVariable(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch salary variable");
		}
	}

	async createSalaryVariable(jwt: string, data: CreateSalaryVariableInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLES,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create salary variable");
		}
	}

	async updateSalaryVariable(jwt: string, id: string, data: UpdateSalaryVariableInput) {
		try {
			const res = await this.client(jwt).put(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update salary variable");
		}
	}

	async deleteSalaryVariable(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete salary variable");
		}
	}

	// ─── Payslip Templates ────────────────────────────────────────────────────────

	async listPayslipTemplates(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch payslip templates");
		}
	}

	async createPayslipTemplate(jwt: string, data: CreatePayslipTemplateInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create payslip template");
		}
	}

	async updatePayslipTemplate(jwt: string, id: string, data: UpdatePayslipTemplateInput) {
		try {
			const res = await this.client(jwt).put(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATE_BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update payslip template");
		}
	}

	async deletePayslipTemplate(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATE_BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete payslip template");
		}
	}

	// ─── Employee Salary Config ───────────────────────────────────────────────────

	async getEmployeeSalaryConfig(jwt: string, empId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG(empId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee salary config");
		}
	}

	async getEmployeeSalaryConfigHistory(jwt: string, empId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG_HISTORY(empId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee salary config history");
		}
	}

	async setEmployeeSalaryConfig(jwt: string, empId: string, data: SetSalaryConfigInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG(empId),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to set employee salary config");
		}
	}

	// ─── Payrolls & Payslips ──────────────────────────────────────────────────────

	async getPayrollSettings(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_SETTINGS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch payroll settings");
		}
	}

	async updatePayrollSettings(jwt: string, data: UpdatePayrollSettingsInput) {
		try {
			const res = await this.client(jwt).put(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_SETTINGS,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update payroll settings");
		}
	}

	async generatePayroll(jwt: string, data: GeneratePayrollInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_GENERATE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to generate payroll");
		}
	}

	async listPayrolls(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLLS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch payrolls");
		}
	}

	async getPayroll(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch payroll");
		}
	}

	async approvePayroll(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_APPROVE(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to approve payroll");
		}
	}

	async rejectPayroll(jwt: string, id: string, data: RejectPayrollInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_REJECT(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to reject payroll");
		}
	}

	async getPayslip(jwt: string, payrollId: string, empId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_PAYSLIP(payrollId, empId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch payslip");
		}
	}

	async getEmployeePayslips(jwt: string, empId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_PAYSLIPS(empId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee payslips");
		}
	}

	async getMyPayslips(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PAYROLL.MY_PAYSLIPS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch my payslips");
		}
	}
}

export const payrollService = new PayrollService();
