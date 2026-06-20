import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type { CreateHolidayInput, UpdateHolidayInput } from "../schemas/shift.schema.js";

export class HolidayService {
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
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.BASE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list holidays");
		}
	}

	async getOne(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch holiday");
		}
	}

	async check(jwt: string, date: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.CHECK, {
				params: { date },
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to check holiday");
		}
	}

	async create(jwt: string, data: CreateHolidayInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create holiday");
		}
	}

	async update(jwt: string, id: string, data: UpdateHolidayInput) {
		try {
			const res = await this.client(jwt).patch(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.BY_ID(id), data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update holiday");
		}
	}

	async delete(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).delete(HRP_API_CONSTANTS.ENDPOINTS.HOLIDAY.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete holiday");
		}
	}
}

export const holidayService = new HolidayService();
