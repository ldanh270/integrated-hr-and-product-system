import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  IAttendanceMetricsDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IAttendanceService,
  IHolidayRepository,
} from "@/types/attendance.types.ts"
import {
  IEmployeeShiftRepository,
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service for managing employee attendance, including check-in, check-out, and record querying.
 */
export class AttendanceService implements IAttendanceService {
  /**
   * Creates a new AttendanceService instance.
   * @param attendanceRepo - Repository for attendance records.
   * @param employeeShiftRepo - Repository for employee shift assignments.
   * @param scheduleRepo - Repository for recurring shift schedules.
   * @param holidayRepo - Repository for holiday information.
   * @param workingShiftRepo - Repository for shift definitions.
   */
  constructor(
    private attendanceRepo: IAttendanceRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    private scheduleRepo: IShiftScheduleRepository,
    private holidayRepo: IHolidayRepository,
    private workingShiftRepo: IWorkingShiftRepository,
  ) {}

  /**
   * Normalizes a date by setting hours, minutes, seconds, and milliseconds to zero.
   * @param date - The date to normalize.
   * @returns A new normalized Date object.
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  /**
   * Resolves a shift ID from a recurring schedule for a specific date.
   * @param schedule - The schedule object.
   * @param date - The target date.
   * @returns The resolved shift ID or undefined if not found.
   */
  private resolveShiftIdFromSchedule(schedule: any, date: Date): string | undefined {
    if (!schedule) return undefined

    const dayOfWeek = date.getDay()
    if (Array.isArray(schedule.days) && schedule.days.length > 0) {
      const day = schedule.days.find((item: any) => item.dayOfWeek === dayOfWeek)
      if (day?.shiftId) {
        return day.shiftId
      }
    }

    if (schedule.workingShiftId) {
      return schedule.workingShiftId
    }

    return undefined
  }

  /**
   * Calculates the duration of a shift in minutes.
   * @param startTime - Start time in minutes from the beginning of the day.
   * @param endTime - End time in minutes from the beginning of the day.
   * @returns Total duration in minutes.
   */
  private getShiftDurationMinutes(startTime: number, endTime: number): number {
    if (endTime >= startTime) {
      return endTime - startTime
    }
    return 1440 - startTime + endTime
  }

  /**
   * Computes attendance metrics (status, late minutes, early leave, overtime, etc.) based on record and shift.
   * @param record - The attendance record.
   * @param shift - The associated shift definition.
   * @returns Computed attendance metrics.
   */
  private computeAttendanceMetrics(record: any, shift: any): IAttendanceMetricsDTO {
    if (!record.checkInAt) {
      return { status: ATTENDANCE_STATUS.ABSENT, totalWorkMinutes: 0 }
    }

    const checkInAt = new Date(record.checkInAt)
    const checkOutAt = new Date()
    const totalWorkMinutes = Math.max(
      0,
      Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000),
    )

    if (!shift) {
      return {
        status: ATTENDANCE_STATUS.ON_TIME,
        totalWorkMinutes,
      }
    }

    const shiftStart = shift.startTime as number
    const shiftEnd = shift.endTime as number
    const gracePeriod = shift.gracePeriodMinutes ?? 0
    const scheduledStart = new Date(checkInAt)
    scheduledStart.setHours(Math.floor(shiftStart / 60), shiftStart % 60, 0, 0)
    const scheduledEnd = new Date(checkInAt)
    scheduledEnd.setHours(Math.floor(shiftEnd / 60), shiftEnd % 60, 0, 0)

    let lateMinutes = 0
    let earlyLeaveMinutes = 0
    let overtimeMinutes = 0

    const minutesLate = Math.max(
      0,
      Math.round((checkInAt.getTime() - scheduledStart.getTime()) / 60000) - gracePeriod,
    )
    if (minutesLate > 0) {
      lateMinutes = minutesLate
    }

    const minutesEarly = Math.max(
      0,
      Math.round((scheduledEnd.getTime() - checkOutAt.getTime()) / 60000),
    )
    if (minutesEarly > 0) {
      earlyLeaveMinutes = minutesEarly
    }

    if (checkOutAt.getTime() > scheduledEnd.getTime()) {
      overtimeMinutes = Math.max(
        0,
        Math.round((checkOutAt.getTime() - scheduledEnd.getTime()) / 60000),
      )
    }

    const status = lateMinutes
      ? ATTENDANCE_STATUS.LATE
      : earlyLeaveMinutes
        ? ATTENDANCE_STATUS.EARLY_LEAVE
        : overtimeMinutes
          ? ATTENDANCE_STATUS.OVERTIME
          : ATTENDANCE_STATUS.ON_TIME

    return {
      status,
      lateMinutes,
      earlyLeaveMinutes,
      overtimeMinutes,
      totalWorkMinutes,
    }
  }

  /**
   * Records a check-in for an employee for the current day.
   * @param employeeId - The employee ID.
   * @param location - The GPS location of the check-in.
   * @param createdById - The ID of the user performing the check-in (usually the employee).
   * @returns The created attendance record.
   * @throws {AppError} If no shift assignment is found for today.
   */
  async checkIn(
    employeeId: string,
    location: { lat: number; lng: number },
    createdById: string,
  ): Promise<any> {
    const today = this.normalizeDate(new Date())

    let employeeShift = await this.employeeShiftRepo.getShiftForEmployeeDate(employeeId, today)
    let shiftId = employeeShift?.shiftId

    if (!shiftId) {
      const schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, today)
      shiftId = this.resolveShiftIdFromSchedule(schedule, today)
    }

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
        "No shift assignment found for today",
        HttpStatusCode.BAD_REQUEST,
        "AttendanceService",
      )
    }

    const shift = shiftId ? await this.workingShiftRepo.findById(shiftId) : null
    if (shift && shift.gpsLat != null && shift.gpsLng != null && shift.gpsRadiusMeters != null) {
      // optional GPS validation can be inserted here
    }

    const isHoliday = await this.holidayRepo.checkIsHoliday(today)
    if (isHoliday) {
      // Holiday logic can be extended here if needed
    }

    return this.attendanceRepo.checkIn(employeeId, location, employeeShift.id)
  }

  /**
   * Records a check-out for an employee for the current day and calculates metrics.
   * @param employeeId - The employee ID.
   * @param location - The GPS location of the check-out.
   * @returns The updated attendance record.
   * @throws {AppError} If no check-in is found for today or if already checked out.
   */
  async checkOut(employeeId: string, location: { lat: number; lng: number }): Promise<any> {
    const today = this.normalizeDate(new Date())
    const record = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today)

    if (!record || !record.checkInAt) {
      throw new AppError(
        "Cannot check out before check in",
        HttpStatusCode.BAD_REQUEST,
        "AttendanceService",
      )
    }

    if (record.checkOutAt) {
      throw new AppError(
        "Attendance already checked out",
        HttpStatusCode.CONFLICT,
        "AttendanceService",
      )
    }

    const employeeShift = record.employeeShift
      ? record.employeeShift
      : await this.employeeShiftRepo.getShiftForEmployeeDate(employeeId, today)

    const metrics = this.computeAttendanceMetrics(record, employeeShift)

    return this.attendanceRepo.checkOut(employeeId, location, metrics)
  }

  /**
   * Fetches attendance records based on the provided query filters.
   * @param query - The query parameters.
   * @returns An array of attendance records.
   */
  async getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<any[]> {
    return this.attendanceRepo.queryRecords(query)
  }
}
