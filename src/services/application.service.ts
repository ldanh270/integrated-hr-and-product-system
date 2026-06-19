import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateApplicationPayload,
	ListApplicationsInput,
	RejectApplicationInput,
} from "../schemas/application.schema.js";

export class ApplicationService {
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

	async createApplication(jwt: string, data: CreateApplicationPayload) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create application");
		}
	}

	async getMyApplications(jwt: string, params?: ListApplicationsInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.ME, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch my applications");
		}
	}

	async getApplication(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch application");
		}
	}

	async cancelApplication(jwt: string, id: string, reason?: string) {
		try {
			const res = await this.client(jwt).patch(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.CANCEL(id), {
				reason,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to cancel application");
		}
	}

	async listAllApplications(jwt: string, params?: ListApplicationsInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BASE, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list applications");
		}
	}

	async listApplicationsByEmployee(
		jwt: string,
		employeeId: string,
		params?: ListApplicationsInput,
	) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BY_EMPLOYEE(employeeId),
				{ params },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee applications");
		}
	}

	async approveApplication(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.APPROVE(id),
				{ status: "approved" },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to approve application");
		}
	}

	async rejectApplication(jwt: string, id: string, reason: string) {
		try {
			const res = await this.client(jwt).patch(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.REJECT(id), {
				rejectReason: reason,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to reject application");
		}
	}
}

export const applicationService = new ApplicationService();
