import {
  APPLICATION_TYPES,
  BATCHABLE_APPLICATION_TYPES,
} from "@/configs/entities/attendance.config.ts"
import { ROLE } from "@/configs/entities/employee.config.ts"
import { NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IApplicationBatchRepository,
  IApplicationBatchService,
  IApplicationRepository,
  IListApplicationsQueryDTO,
  ISubmitBatchApplicationDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { prisma } from "@/libs/database.ts"

import { NotificationService } from "@/services/notification.service.ts"
import {
  ApplicationTypeStrategyFactory,
  IStrategyDeps,
} from "@/services/application-type.strategy.ts"

interface IBatchResult {
  applications?: Array<{ shiftSwapDetail?: { swapWithEmployeeId?: string } }>
  employeeId?: string
  [key: string]: unknown
}

const BATCH_SERVICE_ERRORS = {
  NOT_BATCHABLE: (type: string) => `Application type '${type}' does not support batch submission`,
  MIN_ITEMS: "Batch must contain at least one item",
  NOT_FOUND: "Application batch not found",
  CANCEL_FORBIDDEN: "Forbidden: You can only cancel your own batches",
  INVALID_DATE_RANGE: (idx: number) =>
    `Item ${idx + 1}: endDate must be greater than or equal to startDate`,
  APPROVER_NOT_FOUND: (id: string) => `Assigned approver '${id}' not found`,
  INVALID_APPROVER_ROLE: "The selected assignee does not have permission to approve applications",
} as const

const BATCH_NOTIFICATIONS = {
  SWAP_PARTNER_TITLE: "Yêu cầu đổi ca mới",
  SWAP_PARTNER_MSG: (employeeName: string) =>
    `${employeeName} đã gửi yêu cầu đổi ca với bạn. Vui lòng xem xét và phản hồi.`,
} as const

const APPROVER_ROLES = [
  ROLE.ADMIN,
  ROLE.GENERAL_MANAGER,
  ROLE.HR_MANAGER,
  ROLE.TEAM_LEADER,
] as string[]

export class ApplicationBatchService implements IApplicationBatchService {
  constructor(
    private batchRepo: IApplicationBatchRepository,
    private notificationService: NotificationService,
    private applicationRepo: IApplicationRepository,
  ) {}

  /**
   * Submits a batch of applications.
   * Validates each item using the type strategy, then creates the batch atomically.
   * For shift_swap items with a partner, sends a notification to each partner.
   *
   * @param data - The batch submission DTO.
   * @returns The created batch with all sub-applications.
   */
  async submitBatch(data: ISubmitBatchApplicationDTO): Promise<unknown> {
    const { type, items, assignedToId, employeeId } = data

    // §V: type must be batchable
    if (!(BATCHABLE_APPLICATION_TYPES as readonly string[]).includes(type)) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.NOT_BATCHABLE(type),
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "NOT_BATCHABLE",
      )
    }

    // §V: minimum 1 item
    if (!items || items.length === 0) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.MIN_ITEMS,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "VALIDATION_ERROR",
      )
    }

    // §V: validate each item's date range
    for (const [i, item] of items.entries()) {
      const startDate = new Date(item.startDate)
      const endDate = new Date(item.endDate ?? item.startDate)
      if (endDate < startDate) {
        throw new AppError(
          BATCH_SERVICE_ERRORS.INVALID_DATE_RANGE(i),
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
          "INVALID_DATE_RANGE",
        )
      }
    }

    // §V: validate type-specific rules per item using existing strategies
    const strategyDeps: IStrategyDeps = {
      applicationRepo: this.applicationRepo,
      notificationService: this.notificationService,
    }

    const strategy = ApplicationTypeStrategyFactory.getStrategy(type)
    for (const item of items) {
      const submitDto = {
        type,
        employeeId,
        startDate: item.startDate,
        endDate: item.endDate ?? item.startDate,
        reason: item.reason,
        note: item.note,
        assignedToId,
        detail: item.detail,
      } as ISubmitApplicationDTO
      await strategy.validate(submitDto, strategyDeps)
    }

    // §V: if assignedToId provided, validate approver role
    if (assignedToId) {
      await this._validateApproverRole(assignedToId)
    }

    // Fetch requester name for notification messages
    const requesterEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { fullName: true },
    })
    const requesterName = requesterEmployee?.fullName ?? "Nhân viên"

    // Create the batch atomically
    const batch = (await this.batchRepo.createBatch(data)) as IBatchResult

    // Post-submit: send notifications for shift_swap items with partners
    if (type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && batch?.applications) {
      for (const app of batch.applications) {
        const swapDetail = app.shiftSwapDetail
        if (swapDetail?.swapWithEmployeeId) {
          await this.notificationService.createNotification({
            userId: swapDetail.swapWithEmployeeId,
            title: BATCH_NOTIFICATIONS.SWAP_PARTNER_TITLE,
            message: BATCH_NOTIFICATIONS.SWAP_PARTNER_MSG(requesterName),
            type: NOTIFICATION_TYPE.APPROVAL,
          })
        }
      }
    }

    return batch
  }

  /**
   * Retrieves an ApplicationBatch by ID.
   *
   * @param id - The batch ID.
   * @returns The batch with sub-applications.
   */
  async getBatchById(id: string): Promise<unknown> {
    const batch = await this.batchRepo.findById(id)
    if (!batch) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }
    return batch
  }

  /**
   * Lists batches for the authenticated employee.
   *
   * @param employeeId - The employee's ID.
   * @param query - Pagination and filter params.
   */
  async listMyBatches(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: unknown[]; total: number }> {
    return this.batchRepo.findByEmployee(employeeId, query)
  }

  /**
   * Lists all batches visible to a manager.
   *
   * @param query - Pagination and filter params.
   * @param user - The requesting user context.
   */
  async listAllBatches(
    query: IListApplicationsQueryDTO,
    user?: { empId: string; role: string },
  ): Promise<{ data: unknown[]; total: number }> {
    return this.batchRepo.findAll(query, user)
  }

  /**
   * Cancels all pending sub-applications in a batch.
   * Only the batch owner can cancel.
   *
   * @param id - The batch ID.
   * @param requesterId - The ID of the requester.
   */
  async cancelBatch(id: string, requesterId: string): Promise<unknown> {
    const batch = (await this.batchRepo.findById(id)) as IBatchResult

    if (!batch) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "NOT_FOUND",
      )
    }

    if (batch.employeeId !== requesterId) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.CANCEL_FORBIDDEN,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        "FORBIDDEN",
      )
    }

    const cancelled = await this.batchRepo.cancelBatch(id, requesterId)
    if (!cancelled) {
      throw new AppError(
        "Failed to cancel batch",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
    }

    return cancelled
  }

  // ─── Private Helpers ───────────────────────────────────────────

  /**
   * §V: Validates that the assigned-to employee exists and holds an approver role.
   */
  private async _validateApproverRole(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, role: true },
    })

    if (!employee) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.APPROVER_NOT_FOUND(employeeId),
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "APPROVER_NOT_FOUND",
      )
    }

    if (!APPROVER_ROLES.includes(employee.role)) {
      throw new AppError(
        BATCH_SERVICE_ERRORS.INVALID_APPROVER_ROLE,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_APPROVER_ROLE",
      )
    }
  }
}
