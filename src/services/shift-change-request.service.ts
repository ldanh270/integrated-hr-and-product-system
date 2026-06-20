import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type { CreateShiftChangeRequestInput } from "../schemas/shift.schema.js";

export class ShiftChangeRequestService {
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

	async getMine(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_MINE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch my shift change requests");
		}
	}

	async create(jwt: string, data: CreateShiftChangeRequestInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REQUESTS,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create shift change request");
		}
	}

	// Note: Approve and Reject are usually under Approval endpoints or specific Application endpoints,
	// but keeping them available if we need to call them directly
	async approve(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_APPROVE(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to approve shift change request");
		}
	}

	async reject(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REJECT(id),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to reject shift change request");
		}
	}
}

export const shiftChangeRequestService = new ShiftChangeRequestService();
