import axios from "axios";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";

/**
 * Default HTTP Client without authentication (Used for login, forgot-password, etc.)
 */
export const hrpClient = axios.create({
	baseURL: HRP_API_CONSTANTS.BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Create an HTTP Client with a Bearer token (Used for authenticated requests)
 */
export const createAuthedClient = (jwtToken: string) => {
	return axios.create({
		baseURL: HRP_API_CONSTANTS.BASE_URL,
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${jwtToken}`,
		},
	});
};
