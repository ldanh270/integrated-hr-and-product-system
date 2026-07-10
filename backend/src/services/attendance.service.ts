import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import {
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IAttendanceRecordDTO,
  IAttendanceScheduleDTO,
  IAttendanceService,
  IHolidayRepository,
} from "@/types/attendance.types.ts"
import {
  IEmployeeShiftRepository,
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import { computeAttendanceMetrics } from "@/utils/attendance/attendance-metrics.util.ts"
import { assertWithinShiftGps } from "@/utils/attendance/attendance-gps.util.ts"
import {
  findActiveAttendanceRecord,
  normalizeAttendanceDate,
} from "@/utils/attendance/attendance-record.util.ts"
import {
  assertCheckInWindow,
  getMinutesFromDateTime,
  isActualShiftMatched,
  isBeforeCheckOutWindow,
  isWithinShiftSelectionWindow,
} from "@/utils/attendance/attendance-shift.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { resolveShiftFromSchedule } from "@/utils/schedule.util.ts"

/** Service for employee attendance: check-in, check-out, and record queries. */
export class AttendanceService implements IAttendanceService {
  constructor(
    private attendanceRepo: IAttendanceRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    private scheduleRepo: IShiftScheduleRepository,
    private holidayRepo: IHolidayRepository,
    private workingShiftRepo: IWorkingShiftRepository,
    private employeeRepo: IEmployeeRepository,
  ) {}

  /** Normalize to local midnight so date-bound shift lookups stay consistent. */
  private normalizeDate(date: Date): Date {
    return normalizeAttendanceDate(date)
  }

  /** Return today's open attendance session, if any. */
  private findActiveRecord(employeeId: string, now: Date) {
    return findActiveAttendanceRecord(this.attendanceRepo, employeeId, now)
  }

  /** Map weekly template to a shift id for the given calendar day. */
  private resolveShiftIdFromSchedule(
    schedule: IAttendanceScheduleDTO | null | undefined,
    date: Date,
  ): string | undefined {
    if (!schedule) return undefined

    const resolved = resolveShiftFromSchedule(schedule, date)
    if (resolved?.shiftId) return resolved.shiftId

    if (schedule.workingShiftId) {
      return schedule.workingShiftId
    }

    return undefined
  }

  /** Last-resort FT shift when employee has no override and no weekly template. */
  private async resolveFallbackShiftId(date: Date): Promise<string | undefined> {
    const activeShifts = (await this.workingShiftRepo.listAll()).filter((shift) => shift.isActive)
    if (activeShifts.length === 0) return undefined

    const currentMinutes = date.getHours() * 60 + date.getMinutes()
    // FT with no schedule today: pick shift whose window contains now, else first active shift.
    const matchingShift = activeShifts.find((shift) =>
      isWithinShiftSelectionWindow(currentMinutes, shift),
    )

    return matchingShift?.id ?? activeShifts[0]?.id
  }

  /**
   * Records employee check-in for today.
   * PT employees require an admin-assigned shift; FT resolves schedule/template then validates GPS.
   * @param employeeId - The employee ID.
   * @param location - GPS coordinates from the client.
   * @param createdById - Account ID for audit when auto-creating a missing shift row.
   * @returns The created or updated attendance record.
   * @throws {AppError} If already checked in, no shift, outside window, or outside GPS radius.
   */
  async checkIn(
    employeeId: string,
    location: { lat: number; lng: number },
    createdById: string,
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const today = this.normalizeDate(now)
    const activeRecord = await this.findActiveRecord(employeeId, now)

    // Block only open sessions — checked-out same-day records may check in again for another PT slot.
    if (activeRecord?.checkInAt && !activeRecord.checkOutAt) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
        HttpStatusCode.CONFLICT,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    const employee = await this.employeeRepo.findById(employeeId)
    const currentMinutes = getMinutesFromDateTime(now)

    // 1. Daily override — PT uses atMinutes to pick the correct slot on multi-shift days.
    let employeeShift = await this.employeeShiftRepo.getShiftForEmployeeDate(employeeId, today, {
      atMinutes: currentMinutes,
    })

    // PT has no weekly template fallback — hours come from admin assign after availability submit.
    if (employee && isPartTimeWorkSchedule(employee)) {
      if (!employeeShift) {
        throw new AppError(
          ATTENDANCE_ERROR_MESSAGES.PT_NO_ASSIGNED_SHIFT,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          ATTENDANCE_LAYERS.SERVICE,
        )
      }

      const shift = await this.workingShiftRepo.findById(employeeShift.shiftId)
      if (!shift) {
        throw new AppError(
          ATTENDANCE_ERROR_MESSAGES.SHIFT_NOT_FOUND,
          HttpStatusCode.BAD_REQUEST,
          ATTENDANCE_LAYERS.SERVICE,
        )
      }

      assertCheckInWindow(now, today, shift)
      assertWithinShiftGps(location, shift)

      // Link attendance to EmployeeShift row — preserves override vs template provenance for PT multi-slot days.
      return this.attendanceRepo.checkIn(employeeId, location, employeeShift.id)
    }

    let shiftId = employeeShift?.shiftId
    let schedule = null as Awaited<
      ReturnType<IShiftScheduleRepository["getScheduleByEmployee"]>
    > | null

    // 2. Fallback to weekly schedule when no daily override exists.
    if (!shiftId) {
      schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, today)
      shiftId = this.resolveShiftIdFromSchedule(schedule, today)
    }

    if (!shiftId && !schedule) {
      shiftId = await this.resolveFallbackShiftId(now)
    }

    if (!shiftId && schedule) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.NO_SCHEDULE_TODAY,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    const shift = shiftId ? await this.workingShiftRepo.findById(shiftId) : null

    // 3. Validate check-in window and GPS radius against resolved shift.
    assertCheckInWindow(now, today, shift)
    assertWithinShiftGps(location, shift)

    if (!employeeShift && shiftId) {
      employeeShift = await this.employeeShiftRepo.ensureShiftForEmployeeDate(
        employeeId,
        today,
        shiftId,
        createdById,
      )
    }

    if (!employeeShift) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.SHIFT_NOT_FOUND,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    // 4. Holiday check — informational today; check-in is not blocked on holidays yet.
    const isHoliday = await this.holidayRepo.checkIsHoliday(today)
    if (isHoliday) {
      // Future: auto-apply overtime rules when holiday attendance is enabled.
    }

    // Same EmployeeShift linkage as PT branch — traceable shift assignment on the record.
    return this.attendanceRepo.checkIn(employeeId, location, employeeShift.id)
  }

  /**
   * Records employee check-out for the active session and computes late/early/overtime metrics.
   * @param employeeId - The employee ID.
   * @param location - GPS coordinates from the client.
   * @returns The updated attendance record.
   * @throws {AppError} If not checked in, too early to check out, or outside GPS radius.
   */
  async checkOut(
    employeeId: string,
    location: { lat: number; lng: number },
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const record = await this.findActiveRecord(employeeId, now)

    if (!record || !record.checkInAt) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_BEFORE_IN,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    const shift = record.employeeShift?.shift
    if (isBeforeCheckOutWindow(now, record, shift)) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }
    assertWithinShiftGps(location, shift)

    const metrics = computeAttendanceMetrics(record, shift, now)
    const actualStartTime = getMinutesFromDateTime(new Date(record.checkInAt))
    const actualEndTime = getMinutesFromDateTime(now)

    return this.attendanceRepo.checkOut(record.id, location, metrics, {
      actualEndTime,
      isMatched: isActualShiftMatched(actualStartTime, actualEndTime, shift),
    })
  }

  /** QR toggle: check-in when no session; check-out when window open, else conflict (no silent double action). */
  async scan(
    employeeId: string,
    location: { lat: number; lng: number },
    createdById: string,
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const record = await this.findActiveRecord(employeeId, now)

    if (!record || !record.checkInAt) {
      return this.checkIn(employeeId, location, createdById)
    }

    const shift = record.employeeShift?.shift
    if (!record.checkOutAt && isBeforeCheckOutWindow(now, record, shift)) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
        HttpStatusCode.CONFLICT,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    return this.checkOut(employeeId, location)
  }

  /** Query attendance history with optional employee/date filters. */
  async getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]> {
    return this.attendanceRepo.queryRecords(query)
  }
}
