import { ErrorCode, ErrorLayer } from "../configs/system/error-code.config.ts"
import { HttpStatusCode } from "../configs/system/http.config.ts"
import { AuthRequest } from "./auth.middleware.ts"
import { authorizationService } from "../services/authorization.service.ts"
import { AppError } from "../utils/error.util.ts"
import { NextFunction, Response } from "express"

export const requirePermission = (permissionCode: string) => {
  return async function requirePermissionMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          "Unauthorized",
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      // Superuser bypass (dynamic admin only)
      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(req.user.empId, permissionCode, true, "dynamic_admin")
        next()
        return
      }

      // Permission check
      if (authContext.permissions.has(permissionCode)) {
        authorizationService.logDecision(req.user.empId, permissionCode, true, "dynamic_permission")
        next()
        return
      }

      // Deny by default
      authorizationService.logDecision(req.user.empId, permissionCode, false, "denied")
      throw new AppError(
        "Forbidden: Insufficient permissions",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN
      )
    } catch (error) {
      next(error)
    }
  }
}

export const requireAnyPermission = (permissionCodes: string[]) => {
  return async function requireAnyPermissionMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          "Unauthorized",
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(req.user.empId, permissionCodes.join(","), true, "dynamic_admin")
        next()
        return
      }

      const hasAny = permissionCodes.some((code) => authContext.permissions.has(code))
      if (hasAny) {
        authorizationService.logDecision(req.user.empId, permissionCodes.join(","), true, "require_any_permission")
        next()
        return
      }

      authorizationService.logDecision(req.user.empId, permissionCodes.join(","), false, "denied")
      throw new AppError(
        "Forbidden: Insufficient permissions",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN
      )
    } catch (error) {
      next(error)
    }
  }
}

export const requireAllPermissions = (permissionCodes: string[]) => {
  return async function requireAllPermissionsMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          "Unauthorized",
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(req.user.empId, permissionCodes.join(","), true, "dynamic_admin")
        next()
        return
      }

      const hasAll = permissionCodes.every((code) => authContext.permissions.has(code))
      if (hasAll) {
        authorizationService.logDecision(req.user.empId, permissionCodes.join(","), true, "require_all_permissions")
        next()
        return
      }

      authorizationService.logDecision(req.user.empId, permissionCodes.join(","), false, "denied")
      throw new AppError(
        "Forbidden: Insufficient permissions",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN
      )
    } catch (error) {
      next(error)
    }
  }
}

export const requireRole = (roleName: string) => {
  return async function requireRoleMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.empId) {
        throw new AppError(
          "Unauthorized",
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          ErrorCode.UNAUTHORIZED
        )
      }

      const authContext = await authorizationService.getAuthorizationContext(req.user.empId)

      if (authContext.isDynamicAdmin) {
        authorizationService.logDecision(req.user.empId, `role:${roleName}`, true, "dynamic_admin")
        next()
        return
      }

      const hasRole = authContext.roles.has(roleName.trim().toLowerCase())
      if (hasRole) {
        authorizationService.logDecision(req.user.empId, `role:${roleName}`, true, "role_match")
        next()
        return
      }

      authorizationService.logDecision(req.user.empId, `role:${roleName}`, false, "denied")
      throw new AppError(
        `Forbidden: Requires role '${roleName}'`,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.FORBIDDEN
      )
    } catch (error) {
      next(error)
    }
  }
}

