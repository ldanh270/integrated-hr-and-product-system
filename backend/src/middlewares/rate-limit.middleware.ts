import rateLimit from "express-rate-limit";

/**
 * Internal API Limiter
 * For internal HR routes. Has a very high limit to ensure legitimate HR operations
 * (like bulk updating Kanban boards) are never blocked, while still satisfying
 * CodeQL / GitHub Advanced Security requirements for authenticated routes.
 */
export const internalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5000, // 5000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public API Limiter
 * Limits public endpoints (like apply for a job) to prevent spam.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
