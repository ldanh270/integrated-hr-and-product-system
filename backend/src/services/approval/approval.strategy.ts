import { ROLE } from "@/configs/entities/employee.config.ts"
import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { APPROVAL_CONFIG, RequestCategory } from "@/configs/rules/approval.config.ts"
import { prisma } from "@/libs/database.ts"

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
    return allowedRoles.includes(ROLE.HR_MANAGER as any)
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
    if (!allowedRoles.includes(ROLE.TEAM_LEADER as any)) return false

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
 * Factory class to resolve the correct strategy based on the processor's role
 */
export class ApprovalStrategyFactory {
  static getStrategy(role: string): IApprovalStrategy {
    switch (role) {
      case ROLE.ADMIN:
      case ROLE.GENERAL_MANAGER:
        return new AdminGMApprovalStrategy()
      case ROLE.HR_MANAGER:
        return new HRApprovalStrategy()
      case ROLE.TEAM_LEADER:
        return new TeamLeaderApprovalStrategy()
      default:
        return new DefaultApprovalStrategy()
    }
  }
}
