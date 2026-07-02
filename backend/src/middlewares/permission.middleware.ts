import { NextFunction, Response } from "express"

import { ErrorCode, ErrorLayer } from "../configs/system/error-code.config.ts"
import { HttpStatusCode } from "../configs/system/http.config.ts"
import { AUTH_ERROR_MESSAGES } from "../constants/auth.constants.ts"
import {
  PERMISSION_DECISION_REASONS,
  PERMISSION_ERROR_MESSAGES,
} from "../constants/permission.constants.ts"
import { authorizationService } from "../services/authorization.service.ts"
import { AppError } from "../utils/error.util.ts"
import { AuthRequest } from "./auth.middleware.ts"

/**
 * Requires one specific permission before allowing request to continue.
 */
export const requirePermission = (permissionCode: string) => {
  return async function requirePermissionMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED,
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      // Superuser bypass (dynamic admin only)
      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCode,
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_ADMIN,
        )
        next()
        return
      }

      // Permission check
      if (authContext.permissions.has(permissionCode)) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCode,
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_PERMISSION,
        )
        next()
        return
      }

      // Deny by default
      authorizationService.logDecision(
        req.user.empId,
        permissionCode,
        false,
        PERMISSION_DECISION_REASONS.DENIED,
      )
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN,
      )
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Requires at least one permission from provided list.
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async function requireAnyPermissionMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED,
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCodes.join(","),
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_ADMIN,
        )
        next()
        return
      }

      const hasAny = permissionCodes.some((code) => authContext.permissions.has(code))
      if (hasAny) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCodes.join(","),
          true,
          PERMISSION_DECISION_REASONS.REQUIRE_ANY_PERMISSION,
        )
        next()
        return
      }

      authorizationService.logDecision(
        req.user.empId,
        permissionCodes.join(","),
        false,
        PERMISSION_DECISION_REASONS.DENIED,
      )
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN,
      )
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Requires all permissions from provided list.
 */
export const requireAllPermissions = (permissionCodes: string[]) => {
  return async function requireAllPermissionsMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED,
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCodes.join(","),
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_ADMIN,
        )
        next()
        return
      }

      const hasAll = permissionCodes.every((code) => authContext.permissions.has(code))
      if (hasAll) {
        authorizationService.logDecision(
          req.user.empId,
          permissionCodes.join(","),
          true,
          PERMISSION_DECISION_REASONS.REQUIRE_ALL_PERMISSIONS,
        )
        next()
        return
      }

      authorizationService.logDecision(
        req.user.empId,
        permissionCodes.join(","),
        false,
        PERMISSION_DECISION_REASONS.DENIED,
      )
      throw new AppError(
        PERMISSION_ERROR_MESSAGES.FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN,
      )
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Requires one specific role before allowing request to continue.
 */
export const requireRole = (roleName: string) => {
  return async function requireRoleMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED,
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(
          req.user.empId,
          `role:${roleName}`,
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_ADMIN,
        )
        next()
        return
      }

      const hasRole = authContext.roles.has(roleName.trim().toLowerCase())
      if (hasRole) {
        authorizationService.logDecision(
          req.user.empId,
          `role:${roleName}`,
          true,
          PERMISSION_DECISION_REASONS.ROLE_MATCH,
        )
        next()
        return
      }

      authorizationService.logDecision(
        req.user.empId,
        `role:${roleName}`,
        false,
        PERMISSION_DECISION_REASONS.DENIED,
      )
      throw new AppError(
        `Forbidden: Requires role '${roleName}'`,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN,
      )
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Requires at least one of the specific roles before allowing request to continue.
 */
export const authorizeRoles = (...roles: string[]) => {
  return async function authorizeRolesMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED,
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(
          req.user.empId,
          `roles:[${roles.join(",")}]`,
          true,
          PERMISSION_DECISION_REASONS.DYNAMIC_ADMIN,
        )
        next()
        return
      }

      const hasAnyRole = roles.some((role) => authContext.roles.has(role.trim().toLowerCase()))
      if (hasAnyRole) {
        authorizationService.logDecision(
          req.user.empId,
          `roles:[${roles.join(",")}]`,
          true,
          PERMISSION_DECISION_REASONS.ROLE_MATCH,
        )
        next()
        return
      }

      authorizationService.logDecision(
        req.user.empId,
        `roles:[${roles.join(",")}]`,
        false,
        PERMISSION_DECISION_REASONS.DENIED,
      )
      throw new AppError(
        `Forbidden: Requires one of roles [${roles.join(",")}]`,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN,
      )
    } catch (error) {
      next(error)
    }
  }
}
