import { z } from "zod"

/**
 * Zod schema for PATCH /api/profile/me
 * All fields optional — partial update semantics
 */
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim()
      .optional(),

    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format")
      .optional(),

    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .optional(),

    nationalId: z
      .string()
      .min(9, "National ID must be at least 9 characters")
      .max(20, "National ID too long")
      .optional(),

    address: z.string().max(500, "Address too long").trim().optional(),
  })
  .strict()

export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>

/**
 * Zod schema for POST /api/profile/me/change-password
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Mật khẩu cũ là bắt buộc"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có tối thiểu 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt",
      ),
  })
  .strict()

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>
