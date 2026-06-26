import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { APPROVAL_CONFIG, RequestCategory } from "@/configs/rules/approval.config.ts"
import { prisma } from "@/libs/database.ts"
import { authorizationService } from "@/services/authorization.service.ts"

export interface IApprovalStrategy {
  canApprove(category: RequestCategory, applicantId: string, processorId: string): Promise<boolean>
}

/**
 * Admin & General Manager: Approve all types of requests for everyone (except self).
 */
export class AdminGMApprovalStrategy implements IApprovalStrategy {
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    if (applicantId === processorId) return false
    return true
  }
}

/**
 * HR Manager: Approve Application & Recruitment Proposals for everyone (except self).
 */
export class HRApprovalStrategy implements IApprovalStrategy {
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    if (applicantId === processorId) return false
    const allowedRoles = APPROVAL_CONFIG[category]?.roles || []
    return (allowedRoles as readonly string[]).includes("hr_manager")
  }
}

/**
 * Team Leader: Approve Application only, for members active in their projects.
 */
export class TeamLeaderApprovalStrategy implements IApprovalStrategy {
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    if (applicantId === processorId) return false

    const allowedRoles = APPROVAL_CONFIG[category]?.roles || []
    if (!(allowedRoles as readonly string[]).includes("team_leader")) return false

    // Verify if applicant is an active member in any active project led by the TL
    const activeProject = await prisma.project.findFirst({
      where: {
        teamLeaderId: processorId,
        status: PROJECT_STATUS.ACTIVE,
        members: {
          some: {
            employeeId: applicantId,
            removedAt: null,
          },
        },
      },
    })

    return !!activeProject
  }
}

/**
 * Default fallback strategy (e.g. for regular employee trying to approve)
 */
export class DefaultApprovalStrategy implements IApprovalStrategy {
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    return false
  }
}

/**
 * Factory class to resolve the correct strategy based on the processor's primary dynamic role.
 * Role names are lower_snake_case AppRole.name values from the database.
 */
export class ApprovalStrategyFactory {
  static async getStrategyForEmployee(processorId: string): Promise<IApprovalStrategy> {
    const authContext = await authorizationService.getAuthorizationContext(processorId)

    // Admin bypass
    if (authContext.isDynamicAdmin) {
      return new AdminGMApprovalStrategy()
    }

    const roles = authContext.roles

    if (roles.has("admin") || roles.has("general_manager")) {
      return new AdminGMApprovalStrategy()
    }
    if (roles.has("hr_manager")) {
      return new HRApprovalStrategy()
    }
    if (roles.has("team_leader")) {
      return new TeamLeaderApprovalStrategy()
    }
    return new DefaultApprovalStrategy()
  }
}
