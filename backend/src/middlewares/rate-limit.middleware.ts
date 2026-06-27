import rateLimit from "express-rate-limit";
import { RATE_LIMIT } from "../configs/system/server.config";

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_LIMIT_PROD,
  standardHeaders: true,
  legacyHeaders: false,
});
