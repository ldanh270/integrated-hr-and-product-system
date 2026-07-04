import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { RequestCategory } from "@/configs/rules/approval.config.ts"
import { prisma } from "@/libs/database.ts"
import { authorizationService } from "@/services/authorization.service.ts"

export interface IApprovalStrategy {
  canApprove(category: RequestCategory, applicantId: string, processorId: string): Promise<boolean>
}

/**
 * Admin & General Manager: Approve all types of requests for everyone (except self).
 */
export class AdminGMApprovalStrategy implements IApprovalStrategy {
  /**
   * Performs operations for canApprove.
   */
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
  /**
   * Performs operations for canApprove.
   */
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    if (applicantId === processorId) return false
    return category !== "password_reset"
  }
}

/**
 * Team Leader: Approve Application only, for members active in their projects.
 */
export class TeamLeaderApprovalStrategy implements IApprovalStrategy {
  /**
   * Performs operations for canApprove.
   */
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    if (applicantId === processorId) return false

    if (category !== "application") return false

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
  /**
   * Performs operations for canApprove.
   */
  async canApprove(
    category: RequestCategory,
    applicantId: string,
    processorId: string,
  ): Promise<boolean> {
    return false
  }
}

/**
 * Factory class to resolve the correct strategy based on the processor's permissions.
 */
export class ApprovalStrategyFactory {
  /**
   * Performs operations for getStrategyForEmployee.
   */
  static async getStrategyForEmployee(processorId: string): Promise<IApprovalStrategy> {
    const authContext = await authorizationService.getAuthorizationContext(processorId)

    if (authContext.isDynamicAdmin || authContext.permissions.has("security.update")) {
      return new AdminGMApprovalStrategy()
    }
    if (authContext.permissions.has("employee.update")) {
      return new HRApprovalStrategy()
    }
    if (authContext.permissions.has("application.approve")) {
      return new TeamLeaderApprovalStrategy()
    }
    return new DefaultApprovalStrategy()
  }
}
