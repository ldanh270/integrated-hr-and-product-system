import { z } from "zod"

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export const LogoutSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type LogoutInput = z.infer<typeof LogoutSchema>
