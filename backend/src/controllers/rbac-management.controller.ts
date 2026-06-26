import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { ApiResponse, IEmployeeService, IRoleService, AppRole, Permission } from "@/types"
import { Response } from "express"

/**
 * Controller handling HTTP request adapters for dynamic RBAC mappings.
 */
export class RbacManagementController {
  constructor(
    private employeeService: IEmployeeService,
    private roleService: IRoleService,
  ) {}

  getEmployeeRoles = async (req: AuthRequest, res: Response<ApiResponse<AppRole[]>>) => {
    const employeeId = String(req.params.id)
    const roles = await this.employeeService.getEmployeeRoles(employeeId)
    res.status(HttpStatusCode.OK).json({ data: roles, error: null })
  }

  assignRole = async (req: AuthRequest, res: Response<ApiResponse<{ success: boolean; created: boolean }>>) => {
    const employeeId = String(req.params.id)
    const roleId = String(req.params.roleId)
    const actorId = req.user?.empId
    const result = await this.employeeService.assignRole(employeeId, roleId, actorId)
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  revokeRole = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    const employeeId = String(req.params.id)
    const roleId = String(req.params.roleId)
    const actorId = req.user?.empId
    const success = await this.employeeService.revokeRole(employeeId, roleId, actorId)
    res.status(HttpStatusCode.OK).json({ data: success, error: null })
  }

  updateRoles = async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
    const employeeId = String(req.params.id)
    const { roleIds, version } = req.body
    const actorId = req.user?.empId
    await this.employeeService.updateRoles(employeeId, roleIds, version, actorId)
    res.status(HttpStatusCode.OK).json({ data: undefined, error: null })
  }

  getRolePermissions = async (req: AuthRequest, res: Response<ApiResponse<Permission[]>>) => {
    const roleId = String(req.params.id)
    const permissions = await this.roleService.getRolePermissions(roleId)
    res.status(HttpStatusCode.OK).json({ data: permissions, error: null })
  }

  assignPermission = async (req: AuthRequest, res: Response<ApiResponse<{ success: boolean; created: boolean }>>) => {
    const roleId = String(req.params.id)
    const permissionId = String(req.params.permissionId)
    const actorId = req.user?.empId
    const result = await this.roleService.assignPermission(roleId, permissionId, actorId)
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  revokePermission = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    const roleId = String(req.params.id)
    const permissionId = String(req.params.permissionId)
    const actorId = req.user?.empId
    const success = await this.roleService.revokePermission(roleId, permissionId, actorId)
    res.status(HttpStatusCode.OK).json({ data: success, error: null })
  }

  updatePermissions = async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
    const roleId = String(req.params.id)
    const { permissionIds } = req.body
    const actorId = req.user?.empId
    await this.roleService.updatePermissions(roleId, permissionIds, actorId)
    res.status(HttpStatusCode.OK).json({ data: undefined, error: null })
  }
}
