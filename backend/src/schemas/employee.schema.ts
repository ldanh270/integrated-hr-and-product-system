import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
} from "@/configs/entities/employee.config.ts"

import { z } from "zod"

const emptyToNull = (val: any) => (val === "" ? null : val)

export const createEmployeeSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username too long")
      .trim()
      .toLowerCase(),

    email: z.string().email("Invalid email format").trim().toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase, one lowercase, one number and one special character",
      ),

    role: z.enum(EMPLOYEE_ROLES).optional(),

    employeeType: z.enum(EMPLOYEE_TYPES).optional(),

    phone: z.preprocess(
      emptyToNull,
      z
        .string()
        .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format")
        .optional()
        .nullable(),
    ),

    position: z.preprocess(
      emptyToNull,
      z.string().max(100, "Position too long").trim().optional().nullable(),
    ),

    status: z.enum(EMPLOYEE_STATUSES).optional(),

    dateOfBirth: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    nationalId: z.preprocess(
      emptyToNull,
      z
        .string()
        .min(9, "National ID must be at least 9 characters")
        .max(20, "National ID too long")
        .optional()
        .nullable(),
    ),

    address: z.preprocess(
      emptyToNull,
      z.string().max(500, "Address too long").trim().optional().nullable(),
    ),

    startDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),
  })
  .strict()

export type CreateEmployeeSchemaType = z.infer<typeof createEmployeeSchema>

export const updateEmployeeSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim()
      .optional(),

    phone: z.preprocess(
      emptyToNull,
      z
        .string()
        .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format")
        .optional()
        .nullable(),
    ),

    position: z.preprocess(
      emptyToNull,
      z.string().max(100, "Position too long").trim().optional().nullable(),
    ),

    employeeType: z.enum(EMPLOYEE_TYPES).optional(),

    status: z.enum(EMPLOYEE_STATUSES).optional(),

    dateOfBirth: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    nationalId: z.preprocess(
      emptyToNull,
      z
        .string()
        .min(9, "National ID must be at least 9 characters")
        .max(20, "National ID too long")
        .optional()
        .nullable(),
    ),

    address: z.preprocess(
      emptyToNull,
      z.string().max(500, "Address too long").trim().optional().nullable(),
    ),

    startDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    endDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),
  })
  .strict()

export type UpdateEmployeeSchemaType = z.infer<typeof updateEmployeeSchema>

export const updateEmployeeStatusSchema = z
  .object({
    status: z.enum(EMPLOYEE_STATUSES),
  })
  .strict()

export type UpdateEmployeeStatusSchemaType = z.infer<typeof updateEmployeeStatusSchema>

export const listEmployeesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  role: z.enum(EMPLOYEE_ROLES).optional(),
  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ListEmployeesQuerySchemaType = z.infer<typeof listEmployeesQuerySchema>
