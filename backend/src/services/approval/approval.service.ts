import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { ApprovalStrategyFactory } from "@/services/approval/approval.strategy.ts"
import { IApprovalItem, IApprovalService, IProcessApprovalDTO } from "@/types/approval.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { ApplicationStatus, ApplicationType, PasswordResetStatus, ProjectStatus } from "@prisma/client"

/**
 * Service for managing approval workflows across different categories (applications, password resets, etc.).
 */
export class ApprovalService implements IApprovalService {
  /**
   * Fetches all pending requests of all types that the current processor is authorized to approve.
   * 
   * @param processorId - The ID of the employee processing the approvals.
   * @param role - The role of the processor.
   * @returns A sorted list of pending approval items.
   */
  async getPendingApprovals(processorId: string, role: string): Promise<IApprovalItem[]> {
    const list: IApprovalItem[] = []
    const strategy = ApprovalStrategyFactory.getStrategy(role)

    // 1. Fetch Applications (Leaves, OT, etc.)
    if (
      role === ROLE.ADMIN ||
      role === ROLE.GENERAL_MANAGER ||
      role === ROLE.HR_MANAGER ||
      role === ROLE.TEAM_LEADER
    ) {
      let employeeIdFilter: string[] | undefined = undefined

      if (role === ROLE.TEAM_LEADER) {
        // Find members of active projects led by this TL
        const ledProjects = await prisma.project.findMany({
          where: { teamLeaderId: processorId, status: ProjectStatus.active },
          include: { members: { where: { removedAt: null } } },
        })
        employeeIdFilter = ledProjects.flatMap((p) => p.members.map((m) => m.employeeId))
      }

      const apps = await prisma.application.findMany({
        where: {
          status: ApplicationStatus.pending,
          ...(employeeIdFilter ? { employeeId: { in: employeeIdFilter } } : {}),
        },
        include: { employee: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      })

      for (const app of apps) {
        const canApprove = await strategy.canApprove("application", app.employeeId, processorId)
        if (canApprove) {
          list.push({
            id: app.id,
            category: "application",
            employeeId: app.employeeId,
            employeeName: app.employee?.fullName || "N/A",
            createdAt: app.createdAt,
            status: app.status,
            details: {
              type: app.type,
              startDate: app.startDate,
              endDate: app.endDate,
              reason: app.reason,
              note: app.note,
            },
          })
        }
      }
    }

    // 2. Fetch Password Reset Requests (admin and general_manager only)
    if (role === ROLE.ADMIN || role === ROLE.GENERAL_MANAGER) {
      const resetRequests = await prisma.passwordResetRequest.findMany({
        where: { status: PasswordResetStatus.pending },
        include: { employee: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      })

      for (const req of resetRequests) {
        const canApprove = await strategy.canApprove("password_reset", req.employeeId, processorId)
        if (canApprove) {
          list.push({
            id: req.id,
            category: "password_reset",
            employeeId: req.employeeId,
            employeeName: req.employee?.fullName || "N/A",
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

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Approves or rejects a specific request based on its category.
   * 
   * @param dto - Data containing request ID, category, processor ID, and new status.
   * @returns The updated request record or a transaction result.
   * @throws {AppError} If the request or processor is not found, or if the processor is not authorized.
   */
  async processApproval(dto: IProcessApprovalDTO): Promise<any> {
    const processorEmployee = await prisma.employee.findUnique({
      where: { id: dto.processorId },
      select: { role: true },
    })
    if (!processorEmployee) {
      throw new AppError("Processor employee not found", HttpStatusCode.NOT_FOUND, "Service")
    }

    const strategy = ApprovalStrategyFactory.getStrategy(processorEmployee.role)
    let applicantId = ""

    if (dto.category === "application") {
      const app = await prisma.application.findUnique({ where: { id: dto.id } })
      if (!app) throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service")
      applicantId = app.employeeId

      if (app.status !== ApplicationStatus.pending) {
        throw new AppError(
          "Request has already been processed",
          HttpStatusCode.BAD_REQUEST,
          "Service",
        )
      }

      const canApprove = await strategy.canApprove(dto.category, applicantId, dto.processorId)
      if (!canApprove) {
        throw new AppError(
          "Forbidden: You do not have permission to approve this request",
          HttpStatusCode.FORBIDDEN,
          "Service",
        )
      }

      return prisma.$transaction(async (tx) => {
        const applicationRecord = await tx.application.findUnique({
          where: { id: dto.id },
          include: { shiftSwapDetail: true },
        })
        if (!applicationRecord) {
          throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service")
        }

        if (
          applicationRecord.type === ApplicationType.shift_swap &&
          dto.status === APPLICATION_STATUS.APPROVED
        ) {
          const swapDetail = applicationRecord.shiftSwapDetail
          if (!swapDetail) {
            throw new AppError(
              "Shift swap detail not found",
              HttpStatusCode.BAD_REQUEST,
              "Service",
            )
          }

          const { employeeShiftId, swapWithShiftId } = swapDetail
          const shiftA = await tx.employeeShift.findUnique({ where: { id: employeeShiftId } })
          const shiftB = swapWithShiftId
            ? await tx.employeeShift.findUnique({ where: { id: swapWithShiftId } })
            : null

          if (!shiftA || !shiftB) {
            throw new AppError(
              "One or both employee shifts not found for swap",
              HttpStatusCode.BAD_REQUEST,
              "Service",
            )
          }

          const tempShiftId = shiftA.shiftId
          await tx.employeeShift.update({
            where: { id: employeeShiftId },
            data: { shiftId: shiftB.shiftId },
          })
          if (swapWithShiftId && tempShiftId) {
            await tx.employeeShift.update({
              where: { id: swapWithShiftId },
              data: { shiftId: tempShiftId },
            })
          }
        }

        return tx.application.update({
          where: { id: dto.id },
          data: {
            status:
              dto.status === APPLICATION_STATUS.APPROVED
                ? ApplicationStatus.approved
                : ApplicationStatus.rejected,
            approvedById: dto.processorId,
            approvedAt: new Date(),
            ...(dto.rejectReason && dto.status === APPLICATION_STATUS.REJECTED
              ? { rejectReason: dto.rejectReason }
              : {}),
          },
        })
      })
    } else if (dto.category === "password_reset") {
      const req = await prisma.passwordResetRequest.findUnique({ where: { id: dto.id } })
      if (!req)
        throw new AppError("Password Reset Request not found", HttpStatusCode.NOT_FOUND, "Service")
      applicantId = req.employeeId

      if (req.status !== PasswordResetStatus.pending) {
        throw new AppError(
          "Request has already been processed",
          HttpStatusCode.BAD_REQUEST,
          "Service",
        )
      }

      const canApprove = await strategy.canApprove(dto.category, applicantId, dto.processorId)
      if (!canApprove) {
        throw new AppError(
          "Forbidden: You do not have permission to approve this request",
          HttpStatusCode.FORBIDDEN,
          "Service",
        )
      }

      const isApproved = dto.status === APPLICATION_STATUS.APPROVED
      let tempPassword = ""

      const updatedReq = await prisma.passwordResetRequest.update({
        where: { id: dto.id },
        data: {
          status: isApproved ? PasswordResetStatus.approved : PasswordResetStatus.rejected,
          approvedById: dto.processorId,
          ...(dto.rejectReason && !isApproved ? { note: dto.rejectReason } : {}),
        },
      })

      if (isApproved) {
        tempPassword = this.generateSecureTempPassword()
        await prisma.employee.update({
          where: { id: applicantId },
          data: { passwordHash: await HashUtil.hash(tempPassword) },
        })
      }

      return { ...updatedReq, tempPassword: tempPassword || undefined }
    } else {
      throw new AppError("Invalid request category", HttpStatusCode.BAD_REQUEST, "Service")
    }
  }

  /**
   * Generates a random secure temporary password.
   * 
   * @returns A 10-character random password string.
   */
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
}
