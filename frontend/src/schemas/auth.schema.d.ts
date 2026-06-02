import { z } from "zod"

/**
 * Zod schema for login request body validation
 * Aligned with the backend schema and validation regexes
 */
export declare const loginSchema: z.ZodObject<
  {
    username: z.ZodString
    password: z.ZodString
  },
  z.core.$strip
>
/**
 * Type inferred from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>
