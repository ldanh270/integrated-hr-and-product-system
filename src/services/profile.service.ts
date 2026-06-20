import { createAuthedClient } from "../utils/hrp-client.js";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import type {
	ChangePasswordInput,
	LinkEmployeeInput,
	UpdateProfileInput,
} from "../schemas/profile.schema.js";

export class ProfileService {
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

	async getMe(jwt: string) {
		try {
			const res = await this.client(jwt).get(HRP_API_CONSTANTS.ENDPOINTS.PROFILE.ME);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to fetch profile");
		}
	}

	async updateMe(jwt: string, data: UpdateProfileInput) {
		try {
			const res = await this.client(jwt).patch(HRP_API_CONSTANTS.ENDPOINTS.PROFILE.ME, data);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to update profile");
		}
	}

	async uploadAvatar(jwt: string, avatarPath: string) {
		try {
			// This will likely require reading the file and sending it as multipart/form-data
			// In MCP context, maybe we don't implement file upload directly, but we can provide the base implementation
			throw new Error("File upload not fully supported in MCP via direct paths currently");
		} catch (e: any) {
			this.handleError(e, "Failed to upload avatar");
		}
	}

	async changePassword(jwt: string, data: ChangePasswordInput) {
		try {
			const res = await this.client(jwt).post(
				HRP_API_CONSTANTS.ENDPOINTS.PROFILE.CHANGE_PASSWORD,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to change password");
		}
	}

	async linkEmployee(jwt: string, data: LinkEmployeeInput) {
		try {
			const res = await this.client(jwt).patch(
				HRP_API_CONSTANTS.ENDPOINTS.PROFILE.LINK_EMPLOYEE,
				data,
			);
			return res.data;
		} catch (e: any) {
			this.handleError(e, "Failed to link employee profile");
		}
	}
}

export const profileService = new ProfileService();
