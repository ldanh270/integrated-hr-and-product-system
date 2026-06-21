import {
  APPLICATION_TYPES,
  LEAVE_BALANCE_DEFAULTS,
  PAID_LEAVE_TYPES,
  PARTNER_APPROVAL_STATUS,
} from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import type { NotificationService } from "@/services/notification.service.ts"
import type { IApplicationRepository, ISubmitApplicationDTO, ILeaveType } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { Application, ApplicationShiftSwapDetail } from "@prisma/client"

type AppWithDetails = Application & { shiftSwapDetail?: ApplicationShiftSwapDetail | null }

// ─── Deps injected by ApplicationService ──────────────────────
export interface IStrategyDeps {
  applicationRepo: IApplicationRepository
  notificationService: NotificationService
}

const STRATEGY_ERRORS = {
  LEAVE_OVERLAP: "Leave request overlaps with an existing pending or approved leave",
  INSUFFICIENT_BALANCE: (quota: number, used: number, requested: number) =>
    `Insufficient leave balance. Quota: ${quota} days/year. Used: ${used} days. Requested: ${requested} days.`,
  SHIFT_NOT_FOUND: (id: string) => `Employee shift '${id}' not found`,
  SHIFT_NOT_OWNED: "Forbidden: The specified shift does not belong to you",
  SWAP_SHIFT_NOT_OWNED: "Forbidden: The swap-with shift does not belong to the target employee",
  EMPLOYEE_NOT_FOUND: (id: string) => `Employee '${id}' not found`,
  EMPLOYEE_INACTIVE: (id: string) => `Employee '${id}' is not active`,
  OVERTIME_START_MISMATCH: (start: string, shift: string) =>
    `Overtime startDate (${start}) must match shift date (${shift})`,
  OVERTIME_END_MISMATCH: (end: string, shift: string) =>
    `Overtime endDate (${end}) must match shift date (${shift})`,
  PARTNER_NOT_APPROVED: "Không thể duyệt: Nhân viên được đổi ca chưa đồng ý",
} as const

const STRATEGY_NOTIFICATIONS = {
  SWAP_REQUEST_TITLE: "Yêu cầu đổi ca làm việc",
  SWAP_REQUEST_MSG: "Bạn nhận được yêu cầu đổi ca làm việc từ một nhân viên. Vui lòng kiểm tra ứng dụng để xác nhận.",
  SWAP_APPROVED_TITLE: "Đổi ca thành công",
  SWAP_APPROVED_MSG: "Đơn đổi ca của bạn đã được quản lý phê duyệt. Lịch làm việc đã được thay đổi.",
} as const

// ─── Strategy Interface ────────────────────────────────────────
export interface IApplicationTypeStrategy {
  /** Pre-submit type-specific validation */
  validate(data: ISubmitApplicationDTO, deps: IStrategyDeps): Promise<void>
  /** Pre-approve type-specific guard (e.g. partner consent) */
  preApprove(app: AppWithDetails, deps: IStrategyDeps): Promise<void>
  /** Post-submit side-effects (e.g. notifications) */
  onSubmit(app: AppWithDetails, deps: IStrategyDeps): Promise<void>
  /** Post-approve side-effects (e.g. notifications) */
  onApprove(app: AppWithDetails, deps: IStrategyDeps): Promise<void>
}

// ─── Base (no-op defaults) ─────────────────────────────────────
abstract class BaseApplicationTypeStrategy implements IApplicationTypeStrategy {
  async validate(_data: ISubmitApplicationDTO, _deps: IStrategyDeps): Promise<void> {}
  async preApprove(_app: AppWithDetails, _deps: IStrategyDeps): Promise<void> {}
  async onSubmit(_app: AppWithDetails, _deps: IStrategyDeps): Promise<void> {}
  async onApprove(_app: AppWithDetails, _deps: IStrategyDeps): Promise<void> {}
}

// ─── Concrete Strategies ───────────────────────────────────────

class LeaveStrategy extends BaseApplicationTypeStrategy {
  async validate(data: ISubmitApplicationDTO, deps: IStrategyDeps): Promise<void> {
    if (data.type !== APPLICATION_TYPES.LEAVE.LABEL) return
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate ?? data.startDate)
    const { leaveType } = data.detail

    // §V4a: no overlap with pending/approved leave
    const hasOverlap = await deps.applicationRepo.checkLeaveOverlap(data.employeeId, startDate, endDate)
    if (hasOverlap) {
      throw new AppError(
        STRATEGY_ERRORS.LEAVE_OVERLAP,
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
        "LEAVE_OVERLAP",
      )
    }

    // §V4b: check balance for paid leave types
    if (!PAID_LEAVE_TYPES.includes(leaveType as ILeaveType)) return
    const quota = LEAVE_BALANCE_DEFAULTS[leaveType as keyof typeof LEAVE_BALANCE_DEFAULTS] ?? 0
    if (quota === 0) return // unlimited

    const year = startDate.getFullYear()
    const usedDays = await deps.applicationRepo.getUsedLeaveDays(data.employeeId, leaveType as ILeaveType, year)
    const requestedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (usedDays + requestedDays > quota) {
      throw new AppError(
        STRATEGY_ERRORS.INSUFFICIENT_BALANCE(quota, usedDays, requestedDays),
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        ErrorLayer.SERVICE,
        "INSUFFICIENT_LEAVE_BALANCE",
      )
    }
  }
}

class OvertimeStrategy extends BaseApplicationTypeStrategy {
  async validate(data: ISubmitApplicationDTO, _deps: IStrategyDeps): Promise<void> {
    if (data.type !== APPLICATION_TYPES.OVERTIME.LABEL) return
    const { employeeShiftId } = data.detail
    await validateShiftOwnership(employeeShiftId, data.employeeId)
    await validateOvertimeDates(employeeShiftId, new Date(data.startDate), new Date(data.endDate ?? data.startDate))
  }
}

class LateEarlyStrategy extends BaseApplicationTypeStrategy {
  async validate(data: ISubmitApplicationDTO, _deps: IStrategyDeps): Promise<void> {
    if (data.type !== APPLICATION_TYPES.LATE_EARLY.LABEL) return
    const { employeeShiftId } = data.detail
    await validateShiftOwnership(employeeShiftId, data.employeeId)
  }
}

class ShiftSwapStrategy extends BaseApplicationTypeStrategy {
  async validate(data: ISubmitApplicationDTO, _deps: IStrategyDeps): Promise<void> {
    if (data.type !== APPLICATION_TYPES.SHIFT_SWAP.LABEL) return
    const { employeeShiftId, swapWithEmployeeId, swapWithShiftId } = data.detail

    await validateShiftOwnership(employeeShiftId, data.employeeId)
    if (swapWithEmployeeId) {
      await validateEmployeeExists(swapWithEmployeeId)
    }
    if (swapWithShiftId && swapWithEmployeeId) {
      await validateShiftOwnership(
        swapWithShiftId,
        swapWithEmployeeId,
        STRATEGY_ERRORS.SWAP_SHIFT_NOT_OWNED,
      )
    }
  }

  async preApprove(app: AppWithDetails, _deps: IStrategyDeps): Promise<void> {
    if (!app.shiftSwapDetail?.swapWithEmployeeId) return
    if (app.shiftSwapDetail.partnerApprovalStatus !== PARTNER_APPROVAL_STATUS.APPROVED) {
      throw new AppError(
        STRATEGY_ERRORS.PARTNER_NOT_APPROVED,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "PARTNER_NOT_APPROVED",
      )
    }
  }

  async onSubmit(app: AppWithDetails, deps: IStrategyDeps): Promise<void> {
    if (!app.shiftSwapDetail?.swapWithEmployeeId) return
    await deps.notificationService.createNotification({
      userId: app.shiftSwapDetail.swapWithEmployeeId,
      title: STRATEGY_NOTIFICATIONS.SWAP_REQUEST_TITLE,
      message: STRATEGY_NOTIFICATIONS.SWAP_REQUEST_MSG,
      type: NOTIFICATION_TYPE.APPROVAL,
    })
  }

  async onApprove(app: AppWithDetails, deps: IStrategyDeps): Promise<void> {
    if (!app.shiftSwapDetail?.swapWithEmployeeId) return
    await deps.notificationService.createNotification({
      userId: app.employeeId,
      title: STRATEGY_NOTIFICATIONS.SWAP_APPROVED_TITLE,
      message: STRATEGY_NOTIFICATIONS.SWAP_APPROVED_MSG,
      type: NOTIFICATION_TYPE.SYSTEM,
    })
    await deps.notificationService.createNotification({
      userId: app.shiftSwapDetail.swapWithEmployeeId,
      title: STRATEGY_NOTIFICATIONS.SWAP_APPROVED_TITLE,
      message: STRATEGY_NOTIFICATIONS.SWAP_APPROVED_MSG,
      type: NOTIFICATION_TYPE.SYSTEM,
    })
  }
}

class DefaultApplicationTypeStrategy extends BaseApplicationTypeStrategy {}

// ─── Factory ──────────────────────────────────────────────────
export class ApplicationTypeStrategyFactory {
  static getStrategy(type: string): IApplicationTypeStrategy {
    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        return new LeaveStrategy()
      case APPLICATION_TYPES.OVERTIME.LABEL:
        return new OvertimeStrategy()
      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        return new LateEarlyStrategy()
      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        return new ShiftSwapStrategy()
      default:
        return new DefaultApplicationTypeStrategy()
    }
  }
}

// ─── Shared Pure Validators ────────────────────────────────────

async function validateShiftOwnership(
  shiftId: string,
  employeeId: string,
  customErrorMessage?: string,
): Promise<void> {
  const shift = await prisma.employeeShift.findUnique({
    where: { id: shiftId },
    select: { employeeId: true },
  })
  if (!shift) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.SHIFT_NOT_FOUND(shiftId),
      HttpStatusCode.NOT_FOUND,
      ErrorLayer.SERVICE,
      "SHIFT_NOT_FOUND",
    ))
  }
  if (shift.employeeId !== employeeId) {
    return Promise.reject(new AppError(
      customErrorMessage || STRATEGY_ERRORS.SHIFT_NOT_OWNED,
      HttpStatusCode.FORBIDDEN,
      ErrorLayer.SERVICE,
      "SHIFT_NOT_OWNED",
    ))
  }
}

async function validateEmployeeExists(employeeId: string): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, status: true, deletedAt: true },
  })
  if (!employee || employee.deletedAt) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.EMPLOYEE_NOT_FOUND(employeeId),
      HttpStatusCode.NOT_FOUND,
      ErrorLayer.SERVICE,
      "EMPLOYEE_NOT_FOUND",
    ))
  }
  if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.EMPLOYEE_INACTIVE(employeeId),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "EMPLOYEE_INACTIVE",
    ))
  }
}

async function validateOvertimeDates(
  employeeShiftId: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  const shift = await prisma.employeeShift.findUnique({
    where: { id: employeeShiftId },
    select: { assignedDate: true },
  })
  if (!shift) return // already caught by validateShiftOwnership

  const shiftDate = new Date(shift.assignedDate)
  const toDateOnly = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

  const shiftDateOnly = toDateOnly(shiftDate)

  if (toDateOnly(startDate).getTime() !== shiftDateOnly.getTime()) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.OVERTIME_START_MISMATCH(startDate.toISOString().slice(0, 10), shiftDate.toISOString().slice(0, 10)),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "OVERTIME_DATE_MISMATCH",
    ))
  }
  if (toDateOnly(endDate).getTime() !== shiftDateOnly.getTime()) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.OVERTIME_END_MISMATCH(endDate.toISOString().slice(0, 10), shiftDate.toISOString().slice(0, 10)),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "OVERTIME_DATE_MISMATCH",
    ))
  }
}
