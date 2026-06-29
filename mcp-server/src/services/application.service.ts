import { createAuthedClient } from "../utils/hrp-client.js";
import { SessionData } from "../types/session.types.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateApplicationPayload,
	ListApplicationsInput,
	RejectApplicationInput,
} from "../schemas/application.schema.js";

export class ApplicationService {
	private client(session: SessionData) {
		return createAuthedClient(session);
	}

	private handleError(error: any, fallback: string): never {
		if (error.response) {
			throw new Error(
				error.response.data?.message || error.response.data?.error?.message || fallback,
			);
		}
		throw new Error(`Connection error: ${error.message}`);
	}

	async createApplication(session: SessionData, data: CreateApplicationPayload) {
		try {
			const res = await this.client(session).post(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create application");
		}
	}

	async getMyApplications(session: SessionData, params?: ListApplicationsInput) {
		try {
			const res = await this.client(session).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.ME, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch my applications");
		}
	}

	async getApplication(session: SessionData, id: string) {
		try {
			const res = await this.client(session).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch application");
		}
	}

	async cancelApplication(session: SessionData, id: string, reason?: string) {
		try {
			const res = await this.client(session).patch(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.CANCEL(id), {
				reason,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to cancel application");
		}
	}

	async listAllApplications(session: SessionData, params?: ListApplicationsInput) {
		try {
			const res = await this.client(session).get(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BASE, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list applications");
		}
	}

	async listApplicationsByEmployee(
		session: SessionData,
		employeeId: string,
		params?: ListApplicationsInput,
	) {
		try {
			const res = await this.client(session).get(
				HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.BY_EMPLOYEE(employeeId),
				{ params },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee applications");
		}
	}

	async approveApplication(session: SessionData, id: string) {
		try {
			const res = await this.client(session).patch(
				HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.APPROVE(id),
				{ status: "approved" },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to approve application");
		}
	}

	async rejectApplication(session: SessionData, id: string, reason: string) {
		try {
			const res = await this.client(session).patch(HRP_API_CONSTANTS.ENDPOINTS.APPLICATION.REJECT(id), {
				rejectReason: reason,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to reject application");
		}
	}
}

export const applicationService = new ApplicationService();
