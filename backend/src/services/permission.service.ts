import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  PERMISSION_AUDIT_ACTIONS,
  PERMISSION_ERROR_CODES,
  PERMISSION_ERROR_MESSAGES,
} from "@/constants/permission.constants.ts"
import {
  CreatePermissionDto,
  IPermissionRepository,
  IPermissionService,
  PaginatedPermissionsDto,
  Permission,
  PermissionListQuery,
  UpdatePermissionDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { auditService } from "./audit.service.ts"
import { authorizationService } from "./authorization.service.ts"

/**
 * Service for managing permission-related business logic operations.
 */
export class PermissionService implements IPermissionService {
  /**
   * Initializes the service with the Permission repository dependency.
   * @param repository The permission repository.
   */
  constructor(private repository: IPermissionRepository) {}

  /**
   * Lists permissions with pagination and filtering.
   * @param query Filtering and pagination query parameters.
   * @returns A paginated list of Permission records.
   */
  async listPermissions(query: PermissionListQuery): Promise<PaginatedPermissionsDto> {
    return this.repository.listPermissionsPaginated(query)
  }

  /**
   * Retrieves details of a specific permission by ID.
   * @param id The permission ID.
   * @returns The Permission object or null.
   * @throws {AppError} If permission is not found.
   */
  async getPermission(id: string): Promise<Permission | null> {
    const permission = await this.repository.findById(id)
    if (!permission) {
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }
    return permission
  }

  /**
   * Creates a new permission record.
   * Enforces that code is unique.
   * @param data DTO containing permission data and the creator actorId.
   * @returns The newly created Permission record.
   */
  async createPermission(data: CreatePermissionDto & { actorId: string }): Promise<Permission> {
    // Check if permission with the same code already exists (active only)
    const existing = await this.repository.findByCode(data.code)
    if (existing) {
      throw new AppError(
        `Permission with code '${data.code}' already exists.`,
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    const permission = await this.repository.createPermission({
      name: data.name,
      code: data.code,
      module: data.module,
      description: data.description,
      createdBy: data.actorId,
    })

    await auditService.log({
      actorId: data.actorId,
      targetPermissionId: permission.id,
      action: PERMISSION_AUDIT_ACTIONS.CREATED,
      newValue: { name: permission.name, code: permission.code, module: permission.module },
    })

    return permission
  }

  /**
   * Updates an existing permission.
   * Ignores the current permission during unique checks.
   * @param id The permission ID to update.
   * @param data DTO containing updates and the updater actorId.
   * @returns The updated Permission record or null.
   */
  async updatePermission(
    id: string,
    data: UpdatePermissionDto & { actorId: string },
  ): Promise<Permission | null> {
    // Verify permission exists
    const current = await this.getPermission(id)
    if (!current) return null

    if (current.isSystem) {
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.SYSTEM_UPDATE,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        PERMISSION_ERROR_CODES.SYSTEM_PROTECTED,
      )
    }

    // Permission code is immutable
    if (data.code && data.code !== current.code) {
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.CODE_IMMUTABLE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    const updated = await this.repository.updatePermission(id, {
      name: data.name,
      code: data.code,
      module: data.module,
      description: data.description,
      isActive: data.isActive,
      updatedBy: data.actorId,
    })

    if (updated) {
      await authorizationService.invalidatePermissionCache(id)
      await auditService.log({
        actorId: data.actorId,
        targetPermissionId: id,
        action: PERMISSION_AUDIT_ACTIONS.UPDATED,
        oldValue: {
          name: current.name,
          description: current.description,
          isActive: current.isActive,
        },
        newValue: {
          name: updated.name,
          description: updated.description,
          isActive: updated.isActive,
        },
      })
    }

    return updated
  }

  /**
   * Soft deletes a permission.
   * Prevents deletion if the permission is assigned to roles.
   * @param id The ID of the permission to delete.
   * @param actorId The ID of the employee performing the delete.
   * @returns A boolean indicating whether the delete succeeded.
   * @throws {AppError} If permission is not found or is currently assigned to a role.
   */
  async deletePermission(id: string, actorId: string): Promise<boolean> {
    // Verify permission exists
    const permission = await this.getPermission(id)
    if (!permission) return false

    if (permission.isSystem) {
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.SYSTEM_DELETE,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        PERMISSION_ERROR_CODES.SYSTEM_PROTECTED,
      )
    }

    try {
      const deleted = await this.repository.deletePermission(id, actorId)
      if (deleted) {
        await authorizationService.invalidatePermissionCache(id)
        await auditService.log({
          actorId,
          targetPermissionId: id,
          action: PERMISSION_AUDIT_ACTIONS.DELETED,
        })
      }
      return deleted
    } catch (error) {
      if (error instanceof Error && error.message === PERMISSION_ERROR_CODES.ASSIGNED) {
        throw new AppError(
          PERMISSION_ERROR_MESSAGES.ASSIGNED,
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
          PERMISSION_ERROR_CODES.ASSIGNED,
        )
      }
      throw error
    }
  }
}
