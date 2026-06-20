import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	AssignScheduleInput,
	OverrideShiftInput,
	GenerateScheduleInput,
	UpdateScheduleSettingsInput,
} from "../schemas/shift.schema.js";

export class ScheduleService {
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

	async getMySchedule(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch my schedule");
		}
	}

	async listMySchedules(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY_ALL);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list my schedules");
		}
	}

	async getEmployeeSchedule(jwt: string, employeeId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_EMPLOYEE(employeeId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch employee schedule");
		}
	}

	async listEmployeeSchedules(jwt: string, employeeId: string) {
		try {
			const res = await this.client(jwt).get(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_EMPLOYEE_ALL(employeeId),
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to list employee schedules");
		}
	}

	async assign(jwt: string, data: AssignScheduleInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_ASSIGN,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to assign schedule");
		}
	}

	async override(jwt: string, data: OverrideShiftInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_OVERRIDE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to override shift");
		}
	}

	async previewGenerate(jwt: string, data: GenerateScheduleInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_GENERATE_PREVIEW,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to preview generated schedule");
		}
	}

	async generate(jwt: string, data: GenerateScheduleInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_GENERATE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to generate schedule");
		}
	}

	async getSettings(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_SETTINGS);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch schedule settings");
		}
	}

	async updateSettings(jwt: string, data: UpdateScheduleSettingsInput) {
		try {
			const res = await this.client(jwt).put(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_SETTINGS,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update schedule settings");
		}
	}
}

export const scheduleService = new ScheduleService();
