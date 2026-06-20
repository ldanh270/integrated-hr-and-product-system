import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	CreateWeeklyTemplateInput,
	UpdateWeeklyTemplateInput,
} from "../schemas/shift.schema.js";

export class WeeklyTemplateService {
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

	async list(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BASE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list weekly templates");
		}
	}

	async getOne(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch weekly template");
		}
	}

	async create(jwt: string, data: CreateWeeklyTemplateInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BASE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create weekly template");
		}
	}

	async update(jwt: string, id: string, data: UpdateWeeklyTemplateInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id),
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update weekly template");
		}
	}

	async delete(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(
				HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete weekly template");
		}
	}

	async apply(jwt: string, id: string, employeeIds: string[]) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.APPLY(id),
				{
					employeeIds,
				},
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to apply weekly template");
		}
	}
}

export const weeklyTemplateService = new WeeklyTemplateService();
