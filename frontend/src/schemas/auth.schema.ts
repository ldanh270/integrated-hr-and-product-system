import { z } from "zod"

// Only contain lowercase letters, numbers, underscores (_) and dots (.)
const USERNAME_REGEX = /^[a-z0-9_.]+$/

// Minimum 8 characters, including at least 1 uppercase, 1 lowercase, 1 number and 1 special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Zod schema for login request body validation
 * Aligned with the backend schema and validation regexes
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .trim()
    .toLowerCase()
    .regex(
      USERNAME_REGEX,
      "Username can only contain lowercase letters, numbers, underscores (_) and dots (.)",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must include at least one uppercase, one lowercase, one number, and one special character",
    ),
})

/**
 * Type inferred from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>
