import { APPROVAL_CONFIG } from "@/configs/approval.config.ts"
import { ROLE } from "@/configs/role.config.ts"
import Employee from "@/entities/Employee.ts"
import Application from "@/entities/attendance/Application.ts"
import PasswordResetRequest from "@/entities/auth/PasswordResetRequest.ts"
import Project from "@/entities/product/Project.ts"
import RecruitmentProposal from "@/entities/recruitment/RecruitmentProposal.ts"
import { ApprovalStrategyFactory } from "@/services/approval/approval.strategy.ts"
import { IApprovalItem, IApprovalService, IProcessApprovalDTO } from "@/types/approval.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

export class ApprovalService implements IApprovalService {
  /**
   * Fetches all pending requests of all types that the current processor is authorized to approve
   */
  async getPendingApprovals(processorId: string, role: string): Promise<IApprovalItem[]> {
    const list: IApprovalItem[] = []
    const strategy = ApprovalStrategyFactory.getStrategy(role)

    // 1. Fetch Applications (Leaves, OT, etc.)
    let applicationQuery: any = { status: "pending" }

    if (role === "team_leader") {
      // Find active projects where processor is the team leader
      const ledProjects = await Project.find({
        teamLeaderId: processorId,
        status: "active",
      }).lean()

      const memberIds = ledProjects.flatMap((p) =>
        p.members.filter((m) => m.removedAt === null).map((m) => m.employeeId.toString()),
      )
      applicationQuery.employeeId = { $in: memberIds }
    } else if (role !== ROLE.ADMIN && role !== ROLE.GENERAL_MANAGER && role !== ROLE.HR_MANAGER) {
      // Other roles cannot see any applications to approve
      applicationQuery = null
    }

    if (applicationQuery) {
      const apps = await Application.find(applicationQuery)
        .populate("employeeId", "fullName")
        .sort({ createdAt: -1 })
        .lean()

      for (const app of apps) {
        const applicantId = app.employeeId?._id?.toString() || ""
        const canApprove = await strategy.canApprove("application", applicantId, processorId)
        if (canApprove) {
          list.push({
            id: app._id.toString(),
            category: "application",
            employeeId: applicantId,
            employeeName: (app.employeeId as any)?.fullName || "N/A",
            createdAt: app.createdAt,
            status: app.status,
            details: {
              type: app.type,
              startDate: app.startDate,
              endDate: app.endDate,
              reason: app.reason,
              note: app.note,
              regimeType: app.regimeType,
            },
          })
        }
      }
    }

    // 2. Fetch Password Reset Requests (admin and general_manager only)
    if (role === ROLE.ADMIN || role === ROLE.GENERAL_MANAGER) {
      const resetRequests = await PasswordResetRequest.find({ status: "pending" })
        .populate("employeeId", "fullName")
        .sort({ createdAt: -1 })
        .lean()

      for (const req of resetRequests) {
        const applicantId = req.employeeId?._id?.toString() || ""
        const canApprove = await strategy.canApprove("password_reset", applicantId, processorId)
        if (canApprove) {
          list.push({
            id: req._id.toString(),
            category: "password_reset",
            employeeId: applicantId,
            employeeName: (req.employeeId as any)?.fullName || "N/A",
            createdAt: req.createdAt,
            status: req.status,
            details: {
              expiresAt: req.expiresAt,
              note: req.note,
            },
          })
        }
      }
    }

    // 3. Fetch Recruitment Proposals (admin, general_manager, hr_manager only)
    if (role === ROLE.ADMIN || role === ROLE.GENERAL_MANAGER || role === ROLE.HR_MANAGER) {
      const proposals = await RecruitmentProposal.find({ status: "pending" })
        .populate("requestedBy", "fullName")
        .sort({ createdAt: -1 })
        .lean()

      for (const prop of proposals) {
        const requesterId = prop.requestedBy?._id?.toString() || ""
        const canApprove = await strategy.canApprove(
          "recruitment_proposal",
          requesterId,
          processorId,
        )
        if (canApprove) {
          list.push({
            id: prop._id.toString(),
            category: "recruitment_proposal",
            employeeId: requesterId,
            employeeName: (prop.requestedBy as any)?.fullName || "N/A",
            createdAt: prop.createdAt,
            status: prop.status,
            details: {
              position: prop.position,
              headcount: prop.headcount,
              reason: prop.reason,
              expectedStart: prop.expectedStart,
            },
          })
        }
      }
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Approves or rejects a specific request
   */
  async processApproval(dto: IProcessApprovalDTO): Promise<any> {
    const processorRole = await this.getEmployeeRole(dto.processorId)
    const strategy = ApprovalStrategyFactory.getStrategy(processorRole)

    let applicantId = ""
    let targetDoc: any = null

    // Fetch details based on categories
    if (dto.category === "application") {
      targetDoc = await Application.findById(dto.id)
      if (!targetDoc) throw new AppError("Application not found", 404, "Service")
      applicantId = targetDoc.employeeId.toString()
    } else if (dto.category === "password_reset") {
      targetDoc = await PasswordResetRequest.findById(dto.id)
      if (!targetDoc) throw new AppError("Password Reset Request not found", 404, "Service")
      applicantId = targetDoc.employeeId.toString()
    } else if (dto.category === "recruitment_proposal") {
      targetDoc = await RecruitmentProposal.findById(dto.id)
      if (!targetDoc) throw new AppError("Recruitment Proposal not found", 404, "Service")
      applicantId = targetDoc.requestedBy.toString()
    } else {
      throw new AppError("Invalid request category", 400, "Service")
    }

    // Verify current status is pending
    if (targetDoc.status !== "pending") {
      throw new AppError("Request has already been processed", 400, "Service")
    }

    // Check authority using the loaded Strategy
    const canApprove = await strategy.canApprove(dto.category, applicantId, dto.processorId)
    if (!canApprove) {
      throw new AppError(
        "Forbidden: You do not have permission to approve this request",
        403,
        "Service",
      )
    }

    const updatedStatus = dto.status === "approved" ? "approved" : "rejected"

    let tempPassword = ""

    // Perform DB updates
    if (dto.category === "application") {
      targetDoc.status = updatedStatus
      targetDoc.approvedBy = dto.processorId
      targetDoc.approvedAt = new Date()
      if (dto.rejectReason && updatedStatus === "rejected") {
        targetDoc.rejectReason = dto.rejectReason
      }
      await targetDoc.save()
    } else if (dto.category === "password_reset") {
      targetDoc.status = updatedStatus
      targetDoc.approvedBy = dto.processorId
      if (dto.rejectReason && updatedStatus === "rejected") {
        targetDoc.note = dto.rejectReason
      }
      await targetDoc.save()

      if (updatedStatus === "approved") {
        const employee = await Employee.findById(targetDoc.employeeId)
        if (!employee) {
          throw new AppError("Associated employee not found", 404, "Service")
        }

        tempPassword = this.generateSecureTempPassword()
        employee.passwordHash = await HashUtil.hash(tempPassword)
        await employee.save()
      }
    } else if (dto.category === "recruitment_proposal") {
      targetDoc.status = updatedStatus
      targetDoc.approvedBy = dto.processorId
      targetDoc.approvedAt = new Date()
      if (dto.rejectReason && updatedStatus === "rejected") {
        targetDoc.rejectReason = dto.rejectReason
      }
      await targetDoc.save()
    }

    return {
      ...targetDoc.toObject(),
      tempPassword: tempPassword || undefined,
    }
  }

  private generateSecureTempPassword(): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*"
    const allChars = uppercase + lowercase + numbers + symbols

    let password =
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = 0; i < 6; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")
  }

  private async getEmployeeRole(employeeId: string): Promise<string> {
    const emp = await Employee.findById(employeeId).select("role").lean()
    if (!emp) throw new AppError("Processor employee not found", 404, "Service")
    return emp.role
  }
}
