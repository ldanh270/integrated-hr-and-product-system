import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateEmployeeInput,
	ListEmployeesInput,
	UpdateEmployeeInput,
	UpdateEmployeeStatusInput,
} from "../schemas/employee.schema.js";

export class EmployeeService {
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

	async list(jwt: string, params?: ListEmployeesInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BASE, { params });
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list employees");
		}
	}

	async listApprovers(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.APPROVERS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list approvers");
		}
	}

	async getOne(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee");
		}
	}

	async create(jwt: string, data: CreateEmployeeInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create employee");
		}
	}

	async update(jwt: string, id: string, data: UpdateEmployeeInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update employee");
		}
	}

	async updateStatus(jwt: string, id: string, data: UpdateEmployeeStatusInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.STATUS(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update employee status");
		}
	}

	async delete(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(HRP_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete employee");
		}
	}
}

export const employeeService = new EmployeeService();
