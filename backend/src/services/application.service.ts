import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  PARTNER_APPROVAL_STATUS,
} from "@/configs/entities/attendance.config.ts"
import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  APPLICATION_SERVICE_ERRORS as SERVICE_ERRORS,
  APPLICATION_SERVICE_NOTIFICATIONS as SERVICE_NOTIFICATIONS,
} from "@/constants/application.constants.ts"
import { prisma } from "@/libs/database.ts"
import {
  ApplicationTypeStrategyFactory,
  IStrategyDeps,
} from "@/services/application-type.strategy.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import { NotificationService } from "@/services/notification.service.ts"
import {
  IApplicationRepository,
  IApplicationService,
  IApplicationStatus,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { Application } from "@prisma/client"

export class ApplicationService implements IApplicationService {
  constructor(
    private applicationRepo: IApplicationRepository,
    private notificationService: NotificationService,
  ) {}

  /**
   * Submits a new application after validating the specific business rules
   * based on the type of application (leave, overtime, late/early, shift swap).
   *
   * @param data - The application submission data transfer object.
   * @returns A promise that resolves to the submitted application.
   * @throws {AppError} If validation fails (e.g. invalid date range, leave overlap, insufficient balance).
   */
  async submitApplication(data: ISubmitApplicationDTO): Promise<any> {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate ?? data.startDate)

    // §V1: endDate must be >= startDate
    if (endDate < startDate) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_DATE_RANGE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_DATE_RANGE",
      )
    }

    // Type-specific validation & side-effects via Strategy Pattern
    const strategyDeps: IStrategyDeps = {
      applicationRepo: this.applicationRepo,
      notificationService: this.notificationService,
    }
    const strategy = ApplicationTypeStrategyFactory.getStrategy(data.type)
    await strategy.validate(data, strategyDeps)

    // §V7: If assignedToId is provided, validate that the person exists and has an approver role
    if (data.assignedToId) {
      await this._validateApproverRole(data.assignedToId)
    }

    const submittedApp = await this.applicationRepo.submit(data)
    await strategy.onSubmit(submittedApp, strategyDeps)
    return submittedApp
  }

  /**
   * Cancels a pending application if the requester is the owner of the application.
   *
   * @param id - The unique identifier of the application to cancel.
   * @param requesterId - The ID of the employee requesting the cancellation.
   * @returns A promise that resolves to the cancelled application.
   * @throws {AppError} If application is not found, requester is not the owner, or application status is not pending.
   */
  async cancelApplication(id: string, requesterId: string): Promise<any> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V2: only owner can cancel
    if (app.employeeId !== requesterId) {
      throw new AppError(
        SERVICE_ERRORS.CANCEL_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "FORBIDDEN",
      )
    }

    // §V3: only pending applications can be cancelled
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_STATUS_TRANSITION(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const cancelled = await this.applicationRepo.cancel(id, requesterId)
    if (!cancelled) {
      throw new AppError(
        SERVICE_ERRORS.CANCEL_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return cancelled
  }

  /**
   * Retrieves an application by its unique identifier.
   *
   * @param id - The unique identifier of the application.
   * @returns A promise that resolves to the application details.
   * @throws {AppError} If the application is not found.
   */
  async getApplicationById(id: string): Promise<any> {
    const app = await this.applicationRepo.findById(id)
    if (!app) {
      throw new AppError(
        SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }
    return app
  }

  /**
   * Lists all applications in the system matching the query parameters.
   *
   * @param query - The pagination, filter, and sort options.
   * @returns A promise that resolves to a list of applications and the total count.
   */
  async listApplications(
    query: IListApplicationsQueryDTO,
    user?: { empId: string; role?: string; isApprover?: boolean },
  ): Promise<{ data: any[]; total: number }> {
    if (user) {
      const authContext = await authorizationService.getAuthorizationContext(user.empId)
      user.isApprover =
        authContext.isDynamicAdmin || authContext.permissions.has("application.approve")
    }
    return this.applicationRepo.findAll(query, user)
  }

  /**
   * Lists applications submitted by a specific employee, enforcing authorization rules if a requester is provided.
   *
   * @param employeeId - The ID of the target employee.
   * @param query - The pagination, filter, and sort options.
   * @param requester - Optional metadata of the user requesting this list (id and role).
   * @returns A promise that resolves to the list of employee's applications and total count.
   * @throws {AppError} If the employee is not found or the requester is forbidden to access their applications.
   */
  async getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
    requester?: { empId: string },
  ): Promise<{ data: any[]; total: number }> {
    // Verify target employee exists and is not soft-deleted
    const employeeExists = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null } as any,
      select: { id: true },
    })

    if (!employeeExists) {
      throw new AppError(
        SERVICE_ERRORS.EMPLOYEE_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "EMPLOYEE_NOT_FOUND",
      )
    }

    // If requester is team_leader (and not a global approver), enforce access rules
    if (requester && employeeId !== requester.empId) {
      const authContext = await authorizationService.getAuthorizationContext(requester.empId)
      const isGlobalApprover =
        authContext.isDynamicAdmin || authContext.permissions.has("employee.update")

      if (!isGlobalApprover && authContext.permissions.has("application.approve")) {
        const activeProject = await prisma.project.findFirst({
          where: {
            teamLeaderId: requester.empId,
            status: PROJECT_STATUS.ACTIVE,
            members: {
              some: {
                employeeId: employeeId,
                removedAt: null,
              },
            },
          },
        })

        if (!activeProject) {
          throw new AppError(
            SERVICE_ERRORS.VIEW_FORBIDDEN,
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE,
            "FORBIDDEN",
          )
        }
      }
    }

    return this.applicationRepo.findByEmployee(employeeId, query)
  }

  /**
   * Approves a pending application.
   *
   * @param id - The ID of the application to approve.
   * @param processorId - The ID of the employee/manager processing the approval.
   * @returns A promise that resolves to the approved application.
   * @throws {AppError} If the application is not found or is not in pending status.
   */
  async approveApplication(id: string, processorId: string): Promise<any> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V8: only pending applications can be approved
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_STATUS_TRANSITION(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const strategyDeps: IStrategyDeps = {
      applicationRepo: this.applicationRepo,
      notificationService: this.notificationService,
    }
    const strategy = ApplicationTypeStrategyFactory.getStrategy(app.type)
    await strategy.preApprove(app, strategyDeps)

    const updated = await this.applicationRepo.approve(id, processorId)
    if (!updated) {
      throw new AppError(
        SERVICE_ERRORS.APPROVE_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    await strategy.onApprove(updated, strategyDeps)
    return updated
  }

  /**
   * Rejects a pending application with a specified reason.
   *
   * @param id - The ID of the application to reject.
   * @param processorId - The ID of the employee/manager processing the rejection.
   * @param rejectReason - The reason for rejecting the application.
   * @returns A promise that resolves to the rejected application.
   * @throws {AppError} If the application is not found or is not in pending status.
   */
  async rejectApplication(id: string, processorId: string, rejectReason: string): Promise<any> {
    const app = await this.applicationRepo.findById(id)

    if (!app) {
      throw new AppError(
        SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    // §V9: only pending applications can be rejected
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_STATUS_TRANSITION(app.status),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_STATUS_TRANSITION",
      )
    }

    const updated = await this.applicationRepo.reject(id, processorId, rejectReason)
    if (!updated) {
      throw new AppError(
        SERVICE_ERRORS.REJECT_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return updated
  }

  /**
   * Processes an application by approving or rejecting it.
   *
   * @deprecated Use approveApplication / rejectApplication instead.
   * @param id - The ID of the application.
   * @param status - The target status (approved/rejected).
   * @param processorId - The ID of the processor.
   * @returns A promise that resolves to the processed application.
   * @throws {AppError} If invalid status is passed or rejection is attempted without a reason.
   */
  async processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null> {
    if (status === APPLICATION_STATUS.APPROVED) {
      return this.approveApplication(id, processorId)
    }
    if (status === APPLICATION_STATUS.REJECTED) {
      throw new AppError(
        SERVICE_ERRORS.USE_REJECT_ENDPOINT,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "USE_REJECT_ENDPOINT",
      )
    }
    throw new AppError(
      SERVICE_ERRORS.INVALID_TRANSITION_TARGET(status as string),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "INVALID_STATUS_TRANSITION",
    )
  }

  /**
   * Approves or rejects a shift swap application as a partner.
   */
  async partnerApproveSwap(
    id: string,
    partnerId: string,
    isApproved: boolean,
  ): Promise<Application> {
    const app = await this.applicationRepo.findById(id)

    if (!app || app.type !== APPLICATION_TYPES.SHIFT_SWAP.LABEL || !app.shiftSwapDetail) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_SWAP_APP,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    if (app.shiftSwapDetail.swapWithEmployeeId !== partnerId) {
      throw new AppError(
        SERVICE_ERRORS.SWAP_PARTNER_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    if (app.shiftSwapDetail.partnerApprovalStatus !== PARTNER_APPROVAL_STATUS.PENDING) {
      throw new AppError(
        SERVICE_ERRORS.SWAP_PARTNER_RESPONDED,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    if (isApproved) {
      // Update partner approval status
      await this.applicationRepo.updateShiftSwapPartnerApproval(
        id,
        PARTNER_APPROVAL_STATUS.APPROVED,
      )

      // Notify manager if assignedToId exists
      if (app.assignedToId) {
        await this.notificationService.createNotification({
          userId: app.assignedToId,
          title: SERVICE_NOTIFICATIONS.SWAP_AGREED_TITLE,
          message: SERVICE_NOTIFICATIONS.SWAP_AGREED_MSG,
        })
      }
    } else {
      // Partner rejects -> reject the whole application
      await this.applicationRepo.updateShiftSwapPartnerApproval(
        id,
        PARTNER_APPROVAL_STATUS.REJECTED,
      )
      await this.rejectApplication(id, partnerId, SERVICE_ERRORS.SWAP_REJECTED_REASON)

      // Notify requester
      await this.notificationService.createNotification({
        userId: app.employeeId,
        title: SERVICE_NOTIFICATIONS.SWAP_REJECTED_TITLE,
        message: SERVICE_NOTIFICATIONS.SWAP_REJECTED_MSG,
      })
    }

    return this.applicationRepo.findById(id)
  }

  /**
   * §V8: Validates that the assigned-to employee exists and holds an approver-eligible role.
   * Approver roles: ADMIN, GENERAL_MANAGER, HR_MANAGER, TEAM_LEADER.
   *
   * @param employeeId - The ID of the employee to assign as approver.
   * @throws {AppError} If not found or role is not approver-eligible.
   */
  private async _validateApproverRole(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    })

    if (!employee) {
      throw new AppError(
        SERVICE_ERRORS.APPROVER_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "APPROVER_NOT_FOUND",
      )
    }

    const authContext = await authorizationService.getAuthorizationContext(employeeId)
    const isApprover =
      authContext.isDynamicAdmin || authContext.permissions.has("application.approve")

    if (!isApprover) {
      throw new AppError(
        SERVICE_ERRORS.INVALID_APPROVER_ROLE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_APPROVER_ROLE",
      )
    }
  }
}
