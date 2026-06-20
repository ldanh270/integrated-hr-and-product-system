import axios, { AxiosInstance } from "axios";
import { HRP_API_CONSTANTS } from "../constants/hrp-api.constants.js";
import { logger } from "./logger.js";

/**
 * Attach request/response interceptors for debug logging.
 * Logs method, URL, status, duration, and error details.
 */
function attachLoggingInterceptors(client: AxiosInstance, label: string): void {
  client.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase() ?? "?";
    const url = config.url ?? "";
    logger.http(`→ [${label}] ${method} ${url}`);
    if (process.env.DEBUG === "true" && config.data) {
      logger.debug(`  Body:`, config.data);
    }
    // Attach start time for duration tracking
    (config as any)._startTime = Date.now();
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const elapsed = Date.now() - ((response.config as any)._startTime ?? Date.now());
      const method = response.config.method?.toUpperCase() ?? "?";
      const url = response.config.url ?? "";
      logger.success(`← [${label}] ${method} ${url} ${response.status} (${elapsed}ms)`);
      return response;
    },
    (error) => {
      const config = error.config ?? {};
      const elapsed = Date.now() - ((config as any)._startTime ?? Date.now());
      const method = config.method?.toUpperCase() ?? "?";
      const url = config.url ?? "";
      const status = error.response?.status ?? "ERR";
      const message = error.response?.data?.message ?? error.message ?? "Unknown error";
      logger.error(`← [${label}] ${method} ${url} ${status} (${elapsed}ms) — ${message}`);
      if (process.env.DEBUG === "true" && error.response?.data) {
        logger.debug(`  Response body:`, error.response.data);
      }
      return Promise.reject(error);
    }
  );
}

/**
 * Default HTTP Client without authentication (Used for login, forgot-password, etc.)
 */
export const hrpClient = axios.create({
  baseURL: HRP_API_CONSTANTS.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
attachLoggingInterceptors(hrpClient, "public");

/**
 * Create an HTTP Client with a Bearer token (Used for authenticated requests)
 */
export const createAuthedClient = (jwtToken: string) => {
  const client = axios.create({
    baseURL: HRP_API_CONSTANTS.BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`,
    },
  });
  attachLoggingInterceptors(client, "authed");
  return client;
};
