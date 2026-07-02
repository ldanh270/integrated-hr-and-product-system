import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { ApiResponse, AppRole, IEmployeeService, IRoleService, Permission } from "@/types"

import { Response } from "express"

/**
 * Controller handling HTTP request adapters for dynamic RBAC mappings.
 */
export class RbacManagementController {
  constructor(
    private employeeService: IEmployeeService,
    private roleService: IRoleService,
  ) {}

  /**
   * Retrieves all roles assigned to a specific employee.
   */
  getEmployeeRoles = async (req: AuthRequest, res: Response<ApiResponse<AppRole[]>>) => {
    const employeeId = String(req.params.id)
    const roles = await this.employeeService.getEmployeeRoles(employeeId)
    res.status(HttpStatusCode.OK).json({ data: roles, error: null })
  }

  /**
   * Assigns a role to a specific employee.
   */
  assignRole = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ success: boolean; created: boolean }>>,
  ) => {
    const employeeId = String(req.params.id)
    const roleId = String(req.params.roleId)
    const actorId = req.user?.empId
    const result = await this.employeeService.assignRole(employeeId, roleId, actorId)
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  /**
   * Revokes a role from a specific employee.
   */
  revokeRole = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    const employeeId = String(req.params.id)
    const roleId = String(req.params.roleId)
    const actorId = req.user?.empId
    const success = await this.employeeService.revokeRole(employeeId, roleId, actorId)
    res.status(HttpStatusCode.OK).json({ data: success, error: null })
  }

  /**
   * Replaces the full role set of a specific employee.
   */
  updateRoles = async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
    const employeeId = String(req.params.id)
    const { roleIds, version } = req.body
    const actorId = req.user?.empId
    await this.employeeService.updateRoles(employeeId, roleIds, version, actorId)
    res.status(HttpStatusCode.OK).json({ data: undefined, error: null })
  }

  /**
   * Retrieves all permissions assigned to a specific role.
   */
  getRolePermissions = async (req: AuthRequest, res: Response<ApiResponse<Permission[]>>) => {
    const roleId = String(req.params.id)
    const permissions = await this.roleService.getRolePermissions(roleId)
    res.status(HttpStatusCode.OK).json({ data: permissions, error: null })
  }

  /**
   * Assigns a permission to a specific role.
   */
  assignPermission = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ success: boolean; created: boolean }>>,
  ) => {
    const roleId = String(req.params.id)
    const permissionId = String(req.params.permissionId)
    const actorId = req.user?.empId
    const result = await this.roleService.assignPermission(roleId, permissionId, actorId)
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  /**
   * Revokes a permission from a specific role.
   */
  revokePermission = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    const roleId = String(req.params.id)
    const permissionId = String(req.params.permissionId)
    const actorId = req.user?.empId
    const success = await this.roleService.revokePermission(roleId, permissionId, actorId)
    res.status(HttpStatusCode.OK).json({ data: success, error: null })
  }

  /**
   * Replaces the full permission set of a specific role.
   */
  updatePermissions = async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
    const roleId = String(req.params.id)
    const { permissionIds } = req.body
    const actorId = req.user?.empId
    await this.roleService.updatePermissions(roleId, permissionIds, actorId)
    res.status(HttpStatusCode.OK).json({ data: undefined, error: null })
  }
}
