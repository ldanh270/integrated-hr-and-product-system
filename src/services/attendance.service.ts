import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	LocationInput,
	GetAttendanceInput,
	CreateShiftInput,
	UpdateShiftInput,
	AssignScheduleInput,
	OverrideScheduleInput,
	SubmitShiftChangeInput,
} from "../schemas/attendance.schema.js";

export class AttendanceService {
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

	// ─── Attendance (Chấm công) ─────────────────────────────────────────────────

	/** POST /api/attendance/check-in */
	async checkIn(jwt: string, location: LocationInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.ATTENDANCE.CHECK_IN, {
				location,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Check-in failed");
		}
	}

	/** POST /api/attendance/check-out */
	async checkOut(jwt: string, location: LocationInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.ATTENDANCE.CHECK_OUT, {
				location,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Check-out failed");
		}
	}

	/** POST /api/attendance/scan — smart scan (auto check-in or check-out) */
	async scan(jwt: string, location: LocationInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.ATTENDANCE.SCAN, {
				location,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Attendance scan failed");
		}
	}

	/** GET /api/attendance — history with optional filters */
	async getHistory(jwt: string, params?: GetAttendanceInput) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.ATTENDANCE.BASE, {
				params,
			});
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch attendance history");
		}
	}

	// ─── Shifts (Ca làm việc) ───────────────────────────────────────────────────

	/** GET /api/shifts */
	async listShifts(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch shifts");
		}
	}

	/** GET /api/shifts/:id */
	async getShift(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id));
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch shift");
		}
	}

	/** POST /api/shifts */
	async createShift(jwt: string, data: CreateShiftInput) {
		try {
			const res = await this.client(jwt).post(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to create shift");
		}
	}

	/** PATCH /api/shifts/:id */
	async updateShift(jwt: string, id: string, data: UpdateShiftInput) {
		try {
			const res = await this.client(jwt).patch(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id), data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update shift");
		}
	}

	// ─── Schedules (Lịch ca) ────────────────────────────────────────────────────

	/** GET /api/schedules/my */
	async getMySchedule(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch current schedule");
		}
	}

	/** GET /api/schedules/my/all */
	async getMyScheduleHistory(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY_ALL);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch schedule history");
		}
	}

	/** POST /api/schedules/assign */
	async assignSchedule(jwt: string, data: AssignScheduleInput) {
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

	/** POST /api/schedules/override */
	async overrideSchedule(jwt: string, data: OverrideScheduleInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_OVERRIDE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to override schedule");
		}
	}

	// ─── Shift Change Requests (Đổi ca) ─────────────────────────────────────────

	/** GET /api/shift-change-requests/mine */
	async getMyShiftChangeRequests(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_MINE);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch shift change requests");
		}
	}

	/** POST /api/shift-change-requests */
	async submitShiftChangeRequest(jwt: string, data: SubmitShiftChangeInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REQUESTS,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to submit shift change request");
		}
	}

	/** PATCH /api/shift-change-requests/:id/approve */
	async approveShiftChangeRequest(jwt: string, id: string) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_APPROVE(id),
				{ status: "approved" },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to approve shift change request");
		}
	}

	/** PATCH /api/shift-change-requests/:id/reject */
	async rejectShiftChangeRequest(jwt: string, id: string, rejectReason: string) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REJECT(id),
				{ rejectReason },
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to reject shift change request");
		}
	}
}

export const attendanceService = new AttendanceService();
