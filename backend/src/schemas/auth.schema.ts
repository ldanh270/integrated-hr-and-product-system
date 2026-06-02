import { REGEX } from "@/configs/auth/auth.config.ts"

import { z } from "zod"

/**
 * Zod schema for login request body validation
 * Ensures email is correctly formatted and password is provided
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .trim()
    .toLowerCase()
    .regex(
      REGEX.USERNAME,
      "Username can only contain lowercase letters, numbers, underscores (_) and dots (.)",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      REGEX.PASSWORD,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
})

/**
 * Type inferred from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>

/**
 * Zod schema for forgot password request body validation
 */
export const forgotPasswordSchema = z.object({
  username: z
    .string()
    .min(3, "Username must at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .trim()
    .toLowerCase(),
})

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>
