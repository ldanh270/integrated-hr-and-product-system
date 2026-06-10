/**
 * Common Database Error Codes
 * Maps database-specific error codes (Prisma, MongoDB, etc.) to standardized definitions
 */
export const DB_ERROR_CODES = {
  // P2002: Prisma Unique Constraint Violation
  // 11000: MongoDB Duplicate Key Error
  UNIQUE_CONSTRAINT: ["P2002", 11000],

  // P2025: Prisma Record Not Found
  RECORD_NOT_FOUND: ["P2025"],

  // P2003: Prisma Foreign Key Constraint Violation
  FOREIGN_KEY_CONSTRAINT: ["P2003"],
} as const
