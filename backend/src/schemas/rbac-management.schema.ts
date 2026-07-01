import { z } from "zod"

/**
 * Zod validation schema for bulk updating employee roles.
 */
export const updateEmployeeRolesSchema = z
  .object({
    roleIds: z.array(z.string().min(1, "Role ID cannot be empty")),
    version: z.number().int("Version must be an integer").min(1, "Version must be at least 1"),
  })
  .strict()

export type UpdateEmployeeRolesSchemaType = z.infer<typeof updateEmployeeRolesSchema>

/**
 * Zod validation schema for bulk updating role permissions.
 */
export const updateRolePermissionsSchema = z
  .object({
    permissionIds: z.array(z.string().min(1, "Permission ID cannot be empty")),
  })
  .strict()

export type UpdateRolePermissionsSchemaType = z.infer<typeof updateRolePermissionsSchema>
