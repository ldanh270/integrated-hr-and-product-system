import { createAuthedClient } from "../utils/hrp-client.js";
import { SessionData } from "../types/session.types.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type { CreateShiftInput, UpdateShiftInput } from "../schemas/shift.schema.js";

export class ShiftService {
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

	async list(session: SessionData) {
		try {
			const res = await this.client(session).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list shifts");
		}
	}

	async getOne(session: SessionData, id: string) {
		try {
			const res = await this.client(session).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch shift");
		}
	}

	async create(session: SessionData, data: CreateShiftInput) {
		try {
			const res = await this.client(session).post(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create shift");
		}
	}

	async update(session: SessionData, id: string, data: UpdateShiftInput) {
		try {
			const res = await this.client(session).patch(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id), data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update shift");
		}
	}

	async delete(session: SessionData, id: string) {
		try {
			const res = await this.client(session).delete(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to delete shift");
		}
	}
}

export const shiftService = new ShiftService();
