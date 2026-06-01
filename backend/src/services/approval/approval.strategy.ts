import { APPROVAL_CONFIG, RequestCategory } from "@/configs/approval.config.ts"
import Project from "@/entities/product/Project.ts"

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
    // Cannot approve self-requests
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

    // Check if HR is configured for this request category
    const allowedRoles = APPROVAL_CONFIG[category]?.roles || []
    return allowedRoles.includes("hr_manager" as any)
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

    // Team Leader is only configured for applications (Leave, OT, etc.)
    const allowedRoles = APPROVAL_CONFIG[category]?.roles || []
    if (!allowedRoles.includes("team_leader" as any)) return false

    // Verify if applicant is an active member in any active project led by the TL
    const activeProject = await Project.findOne({
      teamLeaderId: processorId,
      status: "active",
      members: {
        $elemMatch: {
          employeeId: applicantId,
          removedAt: null,
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
      case "admin":
      case "general_manager":
        return new AdminGMApprovalStrategy()
      case "hr_manager":
        return new HRApprovalStrategy()
      case "team_leader":
        return new TeamLeaderApprovalStrategy()
      default:
        return new DefaultApprovalStrategy()
    }
  }
}
