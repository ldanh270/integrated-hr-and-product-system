import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../configs/system/server.config";

/**
 * apiLimiter is a rate limiting middleware used to prevent DDoS and spam requests.
 * It limits the number of API requests from a single IP address within a specific time window (15 minutes).
 */
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_LIMIT_PROD,
  standardHeaders: true,
  legacyHeaders: false,
});
