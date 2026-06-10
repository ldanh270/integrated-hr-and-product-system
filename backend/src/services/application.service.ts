import {
  APPLICATION_STATUS,
  LEAVE_BALANCE_DEFAULTS,
  LEAVE_TYPE,
  PAID_LEAVE_TYPES,
} from "@/configs/entities/attendance.config.ts"
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

  // ─── Submit ──────────────────────────────────────────────────

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
      case "leave":
        await this._validateLeaveApplication(data.employeeId, data.detail.leaveType, startDate, endDate)
        break

      case "overtime":
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        await this._validateOvertimeDates(data.detail.employeeShiftId, startDate, endDate)
        break

      case "late_early":
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        break

      case "shift_swap":
        await this._validateShiftOwnership(data.detail.employeeShiftId, data.employeeId)
        if (data.detail.swapWithEmployeeId) {
          await this._validateEmployeeExists(data.detail.swapWithEmployeeId)
        }
        if (data.detail.swapWithShiftId && data.detail.swapWithEmployeeId) {
          await this._validateShiftOwnership(
            data.detail.swapWithShiftId,
            data.detail.swapWithEmployeeId,
          )
        }
        break

      // work_from_home, business_trip, regime — no extra ownership checks
      default:
        break
    }

    return this.applicationRepo.submit(data)
  }

  // ─── Cancel ──────────────────────────────────────────────────

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

  // ─── Read ─────────────────────────────────────────────────────

  async getApplicationById(id: string): Promise<any> {
    const app = await this.applicationRepo.findById(id)
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service", "NOT_FOUND")
    }
    return app
  }

  async listApplications(
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }> {
    return this.applicationRepo.findAll(query)
  }

  async getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<{ data: any[]; total: number }> {
    return this.applicationRepo.findByEmployee(employeeId, query)
  }

  // ─── Approve / Reject (kept for backward compat with approval route) ──

  async processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<any | null> {
    const updated = await this.applicationRepo.approve(id, status, processorId)
    if (!updated) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, "Service")
    }
    return updated
  }

  // ─── Private Validators ───────────────────────────────────────

  /**
   * §V4: leave — check overlap + balance
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
   * §V5: Verify employeeShift belongs to the requester
   */
  private async _validateShiftOwnership(shiftId: string, employeeId: string): Promise<void> {
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
        "Forbidden: The specified shift does not belong to you",
        HttpStatusCode.FORBIDDEN,
        "Service",
        "SHIFT_NOT_OWNED",
      )
    }
  }

  /**
   * §V6: overtime — application startDate must match shift.assignedDate
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
   * §V7: validate swap target employee exists and is active
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

    if (employee.status !== "active") {
      throw new AppError(
        `Employee '${employeeId}' is not active`,
        HttpStatusCode.BAD_REQUEST,
        "Service",
        "EMPLOYEE_INACTIVE",
      )
    }
  }
}
