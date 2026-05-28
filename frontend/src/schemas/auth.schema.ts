import { z } from "zod"

/**
 * Zod schema for login request body validation
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email format"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(1, "Password cannot be empty"),
})

/**
 * Type inferred from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>
