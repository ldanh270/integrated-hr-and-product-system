import {
  APPLICATION_TYPES,
  LEAVE_BALANCE_DEFAULTS,
  PAID_LEAVE_TYPES,
  PARTNER_APPROVAL_STATUS,
  EMPLOYEE_SHIFT_STATUS,
} from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { NOTIFICATION_TYPE } from "@/configs/entities/notification.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import type { NotificationService } from "@/services/notification.service.ts"
import type { IApplicationRepository, ISubmitApplicationDTO, ILeaveType } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"
import { Application, ApplicationShiftSwapDetail, AttendanceStatus } from "@prisma/client"

type AppWithDetails = Application & { shiftSwapDetail?: ApplicationShiftSwapDetail | null }

// ─── Deps injected by ApplicationService ──────────────────────
export interface IStrategyDeps {
  applicationRepo: IApplicationRepository
  notificationService: NotificationService
}

const STANDARD_WORK_MINUTES = 8 * 60; // 8 hours

const STRATEGY_ERRORS = {
  LEAVE_OVERLAP: "Khoảng thời gian nghỉ phép bị trùng lặp với một đơn đã duyệt hoặc đang chờ duyệt khác",
  INSUFFICIENT_BALANCE: (quota: number, used: number, requested: number) =>
    `Không đủ số ngày phép. Tổng phép: ${quota} ngày. Đã dùng: ${used} ngày. Đang yêu cầu: ${requested} ngày.`,
  SHIFT_NOT_FOUND: (id: string) => `Không tìm thấy ca làm việc '${id}'`,
  SHIFT_NOT_OWNED: "Từ chối: Ca làm việc này không thuộc về bạn",
  SWAP_SHIFT_NOT_OWNED: "Từ chối: Ca muốn đổi không thuộc về nhân viên đích",
  EMPLOYEE_NOT_FOUND: (id: string) => `Không tìm thấy nhân viên '${id}'`,
  EMPLOYEE_INACTIVE: (id: string) => `Nhân viên '${id}' hiện không hoạt động`,
  OVERTIME_START_MISMATCH: (start: string, shift: string) =>
    `Ngày bắt đầu làm thêm (${start}) phải khớp với ngày của ca làm (${shift})`,
  OVERTIME_END_MISMATCH: (end: string, shift: string) =>
    `Ngày kết thúc làm thêm (${end}) phải khớp với ngày của ca làm (${shift})`,
  PARTNER_NOT_APPROVED: "Không thể duyệt: Nhân viên được đổi ca chưa đồng ý",
} as const

const STRATEGY_NOTIFICATIONS = {
  SWAP_REQUEST_TITLE: "Yêu cầu đổi ca làm việc",
  SWAP_REQUEST_MSG: "Bạn nhận được yêu cầu đổi ca làm việc từ một nhân viên. Vui lòng kiểm tra ứng dụng để xác nhận.",
  SWAP_APPROVED_TITLE: "Đổi ca thành công",
  SWAP_APPROVED_MSG: "Đơn đổi ca của bạn đã được quản lý phê duyệt. Lịch làm việc đã được thay đổi.",
} as const

const LEAVE_NOTES = {
  UNPAID_EXCEED_LIMIT: "Nghỉ phép không lương (Vượt hạn mức)",
  PAID_APPROVED: "Nghỉ phép có lương",
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

    // §V4b: We no longer block on insufficient balance here.
    // Balance checking and paid/unpaid deduction is handled in onApprove.
  }

  async onApprove(app: AppWithDetails, deps: IStrategyDeps): Promise<void> {
    if (app.type !== APPLICATION_TYPES.LEAVE.LABEL) return
    const leaveDetail = await prisma.applicationLeaveDetail.findUnique({
      where: { applicationId: app.id },
    })
    if (!leaveDetail || !PAID_LEAVE_TYPES.includes(leaveDetail.leaveType as ILeaveType)) return

    // Find the employee to get current leave balance
    const employee = await prisma.employee.findUnique({
      where: { id: app.employeeId },
      select: { totalLeaves: true, usedLeaves: true },
    })
    if (!employee) return

    let currentUsed = employee.usedLeaves
    const maxLeaves = employee.totalLeaves

    // Find scheduled shifts between startDate and endDate
    const shifts = await prisma.employeeShift.findMany({
      where: {
        employeeId: app.employeeId,
        assignedDate: { gte: app.startDate, lte: app.endDate },
      },
    })

    // For each shift, decide if it's paid or unpaid based on balance
    const shiftPromises = shifts.map(async (shift) => {
      let isPaid = false
      let status: AttendanceStatus = AttendanceStatus.absent // Default if out of balance
      let note: string = LEAVE_NOTES.UNPAID_EXCEED_LIMIT

      if (currentUsed < maxLeaves) {
        // Still have balance
        isPaid = true
        status = AttendanceStatus.on_time
        note = LEAVE_NOTES.PAID_APPROVED
        currentUsed += 1
      }

      // Upsert AttendanceRecord
      const attendance = await prisma.attendanceRecord.upsert({
        where: { employeeShiftId: shift.id },
        create: {
          employeeId: app.employeeId,
          employeeShiftId: shift.id,
          date: shift.assignedDate,
          status,
          isPaidLeave: isPaid,
          note: note,
          totalWorkMinutes: isPaid ? STANDARD_WORK_MINUTES : 0,
        },
        update: {
          status,
          isPaidLeave: isPaid,
          note: note,
          totalWorkMinutes: isPaid ? STANDARD_WORK_MINUTES : 0,
        },
      })

      // Create RealShift if it's paid (so it shows as worked)
      if (isPaid) {
        const STANDARD_SHIFT_START_MINUTES = 8 * 60; // 08:00
        const STANDARD_SHIFT_END_MINUTES = 17 * 60; // 17:00

        await prisma.realShift.upsert({
          where: { attendanceRecordId: attendance.id },
          create: {
            employeeId: app.employeeId,
            attendanceRecordId: attendance.id,
            date: shift.assignedDate,
            actualStartTime: STANDARD_SHIFT_START_MINUTES,
            actualEndTime: STANDARD_SHIFT_END_MINUTES,
            isMatched: true,
          },
          update: {
            actualStartTime: STANDARD_SHIFT_START_MINUTES,
            actualEndTime: STANDARD_SHIFT_END_MINUTES,
            isMatched: true,
          },
        })
      }
    })

    await Promise.all(shiftPromises)

    // Finally, update the employee's usedLeaves
    await prisma.employee.update({
      where: { id: app.employeeId },
      data: { usedLeaves: currentUsed },
    })
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

class ResignationStrategy extends BaseApplicationTypeStrategy {
  async onApprove(app: AppWithDetails, deps: IStrategyDeps): Promise<void> {
    if (!app.endDate) return

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: app.employeeId },
        data: {
          status: EMPLOYEE_STATUS.INACTIVE,
          endDate: app.endDate,
        }
      })
      
      await tx.projectMember.updateMany({
        where: { employeeId: app.employeeId, removedAt: null },
        data: { removedAt: app.endDate }
      })
      
      await tx.employeeShift.updateMany({
        where: { employeeId: app.employeeId, assignedDate: { gt: app.endDate } },
        data: { status: EMPLOYEE_SHIFT_STATUS.CANCELLED }
      })
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
      case APPLICATION_TYPES.RESIGNATION.LABEL:
        return new ResignationStrategy()
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
    ) as Error)
  }
  if (shift.employeeId !== employeeId) {
    return Promise.reject(new AppError(
      customErrorMessage || STRATEGY_ERRORS.SHIFT_NOT_OWNED,
      HttpStatusCode.FORBIDDEN,
      ErrorLayer.SERVICE,
      "SHIFT_NOT_OWNED",
    ) as Error)
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
    ) as Error)
  }
  if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.EMPLOYEE_INACTIVE(employeeId),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "EMPLOYEE_INACTIVE",
    ) as Error)
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
    ) as Error)
  }
  if (toDateOnly(endDate).getTime() !== shiftDateOnly.getTime()) {
    return Promise.reject(new AppError(
      STRATEGY_ERRORS.OVERTIME_END_MISMATCH(endDate.toISOString().slice(0, 10), shiftDate.toISOString().slice(0, 10)),
      HttpStatusCode.BAD_REQUEST,
      ErrorLayer.SERVICE,
      "OVERTIME_DATE_MISMATCH",
    ) as Error)
  }
}
