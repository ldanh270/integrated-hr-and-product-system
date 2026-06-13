import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  LEAVE_BALANCE_DEFAULTS,
  PAID_LEAVE_TYPES,
} from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS, ROLE } from "@/configs/entities/employee.config.ts"
import { PROJECT_STATUS } from "@/configs/entities/project.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  IApplicationRepository,
  IApplicationService,
  IApplicationStatus,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class ApplicationService implements IApplicationService {
  constructor(private applicationRepo: IApplicationRepository) {}

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
        "endDate must be greater than or equal to startDate",
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "INVALID_DATE_RANGE",
      )
    }

    // Type-specific business rule validation
    switch (data.type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        await this._validateLeaveApplication(
          data.employeeId,
          data.detail.leaveType,
          startDate,
          endDate,
        )
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        await this._validateOvertimeDates(data.detail.employeeShiftId, startDate, endDate)
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        if (data.detail.swapWithEmployeeId) {
          await this._validateEmployeeExists(data.detail.swapWithEmployeeId)
        }
        if (data.detail.swapWithShiftId && data.detail.swapWithEmployeeId) {
          await this._validateShiftOwnership(
            data.detail.swapWithShiftId,
            data.detail.swapWithEmployeeId,
            "Forbidden: The swap-with shift does not belong to the target employee",
          )
        }
        break

      // work_from_home, business_trip, regime — no extra ownership checks
      default:
        break
    }

    // §V7: If assignedToId is provided, validate that the person exists and has an approver role
    if (data.assignedToId) {
      await this._validateApproverRole(data.assignedToId)
    }

    return this.applicationRepo.submit(data)
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
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service", "NOT_FOUND")
    }

    // §V2: only owner can cancel
    if (app.employeeId !== requesterId) {
      throw new AppError(
        "Forbidden: You can only cancel your own applications",
        HttpStatusCode.FORBIDDEN,
        "Service",
        "FORBIDDEN",
      )
    }

    // §V3: only pending applications can be cancelled
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        `Cannot cancel application with status '${app.status}'`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "INVALID_STATUS_TRANSITION",
      )
    }

    const cancelled = await this.applicationRepo.cancel(id, requesterId)
    if (!cancelled) {
      throw new AppError(
        "Failed to cancel application",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Service",
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
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service", "NOT_FOUND")
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
  ): Promise<{ data: any[]; total: number }> {
    return this.applicationRepo.findAll(query)
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
    requester?: { empId: string; role: string },
  ): Promise<{ data: any[]; total: number }> {
    // 1. Verify target employee exists and is not soft-deleted
    const employeeExists = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null } as any,
      select: { id: true },
    })

    if (!employeeExists) {
      throw new AppError(
        `Employee '${employeeId}' not found`,
        HttpStatusCode.NOT_FOUND,
        "Service",
        "EMPLOYEE_NOT_FOUND",
      )
    }

    // 2. If requester is team_leader, enforce access rules
    if (requester && requester.role === ROLE.TEAM_LEADER && employeeId !== requester.empId) {
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
          "Forbidden: You can only view applications of employees in your projects",
          HttpStatusCode.FORBIDDEN,
          "Service",
          "FORBIDDEN",
        )
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
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service", "NOT_FOUND")
    }

    // §V8: only pending applications can be approved
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        `Cannot approve application with status '${app.status}'`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "INVALID_STATUS_TRANSITION",
      )
    }

    const updated = await this.applicationRepo.approve(id, processorId)
    if (!updated) {
      throw new AppError(
        "Failed to approve application",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Service",
      )
    }

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
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service", "NOT_FOUND")
    }

    // §V9: only pending applications can be rejected
    if (app.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        `Cannot reject application with status '${app.status}'`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "INVALID_STATUS_TRANSITION",
      )
    }

    const updated = await this.applicationRepo.reject(id, processorId, rejectReason)
    if (!updated) {
      throw new AppError(
        "Failed to reject application",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Service",
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
        "Use rejectApplication() — rejectReason is required",
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "USE_REJECT_ENDPOINT",
      )
    }
    throw new AppError(
      `Invalid status transition: '${status}'`,
      HttpStatusCode.BAD_REQUEST,
      "Service",
      "INVALID_STATUS_TRANSITION",
    )
  }

  /**
   * §V4: Leave application validator. Checks for date overlaps and leave balance quotas.
   *
   * @param employeeId - The ID of the employee submitting the leave.
   * @param leaveType - The type of leave (annual, sick, etc.).
   * @param startDate - The starting date of the leave.
   * @param endDate - The ending date of the leave.
   * @throws {AppError} If overlap is detected or the employee has insufficient leave balance.
   */
  private async _validateLeaveApplication(
    employeeId: string,
    leaveType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // §V4a: no overlap with pending/approved leave
    const hasOverlap = await this.applicationRepo.checkLeaveOverlap(employeeId, startDate, endDate)
    if (hasOverlap) {
      throw new AppError(
        "Leave request overlaps with an existing pending or approved leave",
        HttpStatusCode.CONFLICT,
        "Service",
        "LEAVE_OVERLAP",
      )
    }

    // §V4b: check leave balance for paid leave types
    if (PAID_LEAVE_TYPES.includes(leaveType as any)) {
      const quota = LEAVE_BALANCE_DEFAULTS[leaveType as keyof typeof LEAVE_BALANCE_DEFAULTS] ?? 0
      if (quota === 0) return // unlimited

      const year = startDate.getFullYear()
      const usedDays = await this.applicationRepo.getUsedLeaveDays(
        employeeId,
        leaveType as any,
        year,
      )

      const requestedDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      if (usedDays + requestedDays > quota) {
        throw new AppError(
          `Insufficient leave balance. Quota: ${quota} days/year. Used: ${usedDays} days. Requested: ${requestedDays} days.`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          "Service",
          "INSUFFICIENT_LEAVE_BALANCE",
        )
      }
    }
  }

  /**
   * §V5: Verifies that the specified employeeShift belongs to the requester.
   *
   * @param shiftId - The ID of the employee shift to check.
   * @param employeeId - The ID of the employee.
   * @throws {AppError} If the shift doesn't exist or is not owned by the employee.
   */
  private async _validateShiftOwnership(
    shiftId: string,
    employeeId: string,
    customErrorMessage?: string,
  ): Promise<void> {
    const shift = await prisma.employeeShift.findUnique({
      where: { id: shiftId },
      select: { employeeId: true },
    })

    if (!shift) {
      throw new AppError(
        `Employee shift '${shiftId}' not found`,
        HttpStatusCode.NOT_FOUND,
        "Service",
        "SHIFT_NOT_FOUND",
      )
    }

    if (shift.employeeId !== employeeId) {
      throw new AppError(
        customErrorMessage || "Forbidden: The specified shift does not belong to you",
        HttpStatusCode.FORBIDDEN,
        "Service",
        "SHIFT_NOT_OWNED",
      )
    }
  }

  /**
   * §V6: Overtime application validator. Verifies that the application dates match the shift date.
   *
   * @param employeeShiftId - The ID of the employee shift.
   * @param startDate - The starting date of the overtime.
   * @param endDate - The ending date of the overtime.
   * @throws {AppError} If either the start or end date does not match the shift's assigned date.
   */
  private async _validateOvertimeDates(
    employeeShiftId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const shift = await prisma.employeeShift.findUnique({
      where: { id: employeeShiftId },
      select: { assignedDate: true },
    })

    if (!shift) return // already caught by _validateShiftOwnership

    const shiftDate = new Date(shift.assignedDate)

    // Normalize to date-only for comparison (strip time)
    const toDateOnly = (d: Date) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

    const shiftDateOnly = toDateOnly(shiftDate)
    const startDateOnly = toDateOnly(startDate)
    const endDateOnly = toDateOnly(endDate)

    if (startDateOnly.getTime() !== shiftDateOnly.getTime()) {
      throw new AppError(
        `Overtime startDate (${startDate.toISOString().slice(0, 10)}) must match shift date (${shiftDate.toISOString().slice(0, 10)})`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "OVERTIME_DATE_MISMATCH",
      )
    }

    if (endDateOnly.getTime() !== shiftDateOnly.getTime()) {
      throw new AppError(
        `Overtime endDate (${endDate.toISOString().slice(0, 10)}) must match shift date (${shiftDate.toISOString().slice(0, 10)})`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "OVERTIME_DATE_MISMATCH",
      )
    }
  }

  /**
   * §V7: Validates that the swap target employee exists, is active, and is not deleted.
   *
   * @param employeeId - The ID of the swap target employee.
   * @throws {AppError} If the target employee is not found, deleted, or not active.
   */
  private async _validateEmployeeExists(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true, deletedAt: true },
    })

    if (!employee || employee.deletedAt) {
      throw new AppError(
        `Employee '${employeeId}' not found`,
        HttpStatusCode.NOT_FOUND,
        "Service",
        "EMPLOYEE_NOT_FOUND",
      )
    }

    if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        `Employee '${employeeId}' is not active`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "EMPLOYEE_INACTIVE",
      )
    }
  }

  /**
   * §V8: Validates that the assigned-to employee exists and holds an approver-eligible role.
   * Approver roles: ADMIN, GENERAL_MANAGER, HR_MANAGER, TEAM_LEADER.
   *
   * @param employeeId - The ID of the employee to assign as approver.
   * @throws {AppError} If not found or role is not approver-eligible.
   */
  private async _validateApproverRole(employeeId: string): Promise<void> {
    const APPROVER_ROLES = [
      ROLE.ADMIN,
      ROLE.GENERAL_MANAGER,
      ROLE.HR_MANAGER,
      ROLE.TEAM_LEADER,
    ] as string[]

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, role: true, status: true },
    })

    if (!employee) {
      throw new AppError(
        `Assigned approver '${employeeId}' not found`,
        HttpStatusCode.NOT_FOUND,
        "Service",
        "APPROVER_NOT_FOUND",
      )
    }

    if (!APPROVER_ROLES.includes(employee.role)) {
      throw new AppError(
        "The selected assignee does not have permission to approve applications",
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "INVALID_APPROVER_ROLE",
      )
    }
  }
}
