import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import {
  ATTENDANCE_GPS_RULES,
  ATTENDANCE_TIME_RULES,
} from "@/configs/rules/attendance.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ATTENDANCE_ERROR_MESSAGES,
  ATTENDANCE_LAYERS,
} from "@/constants/attendance.constants.ts"
import {
  IAttendanceMetricsDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IAttendanceRecordDTO,
  IAttendanceScheduleDTO,
  IAttendanceService,
  IAttendanceShiftDTO,
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
  private resolveShiftIdFromSchedule(
    schedule: IAttendanceScheduleDTO | null | undefined,
    date: Date,
  ): string | undefined {
    if (!schedule) return undefined

    const dayOfWeek = date.getDay()
    if (Array.isArray(schedule.days) && schedule.days.length > 0) {
      const day = schedule.days.find((item) => item.dayOfWeek === dayOfWeek)
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
    return ATTENDANCE_TIME_RULES.MINUTES_PER_DAY - startTime + endTime
  }

  /**
   * Checks whether a minute-of-day value falls within a shift window (supports overnight shifts).
   */
  private isWithinShiftWindow(currentMinutes: number, startTime: number, endTime: number): boolean {
    if (endTime >= startTime) {
      return currentMinutes >= startTime && currentMinutes <= endTime
    }
    return currentMinutes >= startTime || currentMinutes <= endTime
  }

  /**
   * Picks an active shift when schedule/assignment has no entry for today (e.g. weekend or missing schedule).
   */
  private async resolveFallbackShiftId(date: Date): Promise<string | undefined> {
    const activeShifts = (await this.workingShiftRepo.listAll()).filter((shift) => shift.isActive)
    if (activeShifts.length === 0) return undefined

    const currentMinutes = date.getHours() * 60 + date.getMinutes()
    const matchingShift = activeShifts.find((shift) =>
      this.isWithinShiftSelectionWindow(currentMinutes, shift),
    )

    return matchingShift?.id ?? activeShifts[0]?.id
  }

  /** Converts a timestamp to minutes-from-midnight for shift comparison. */
  private getMinutesFromDateTime(date: Date): number {
    return date.getHours() * 60 + date.getMinutes()
  }

  /** True when actual check-in/out minutes exactly match the planned shift bounds. */
  private isActualShiftMatched(
    actualStartTime: number,
    actualEndTime: number,
    shift: IAttendanceShiftDTO | null | undefined,
  ): boolean {
    return Boolean(
      shift && actualStartTime === shift.startTime && actualEndTime === shift.endTime,
    )
  }

  /** Resolves grace-period window length; falls back to the global default when shift has none. */
  private getWindowMinutes(shift?: IAttendanceShiftDTO | null): number {
    return shift?.gracePeriodMinutes ?? ATTENDANCE_TIME_RULES.DEFAULT_WINDOW_MINUTES
  }

  /** Type guard: end time before start time means the shift spans midnight. */
  private isOvernightShift(
    shift: IAttendanceShiftDTO | null | undefined,
  ): shift is IAttendanceShiftDTO {
    return Boolean(shift && shift.endTime < shift.startTime)
  }

  /** Matches current time to a shift when picking a fallback (includes pre-shift grace window). */
  private isWithinShiftSelectionWindow(
    currentMinutes: number,
    shift: IAttendanceShiftDTO,
  ): boolean {
    const windowStart =
      (shift.startTime - this.getWindowMinutes(shift) + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY) %
      ATTENDANCE_TIME_RULES.MINUTES_PER_DAY

    return this.isWithinShiftWindow(currentMinutes, windowStart, shift.endTime)
  }

  /** Converts minute-of-day shift bounds into concrete Date objects; rolls end to next day for overnight shifts. */
  private getShiftDateTimes(
    baseDate: Date,
    shift: IAttendanceShiftDTO,
  ): { start: Date; end: Date } {
    const start = new Date(baseDate)
    start.setHours(Math.floor(shift.startTime / 60), shift.startTime % 60, 0, 0)

    const end = new Date(baseDate)
    end.setHours(Math.floor(shift.endTime / 60), shift.endTime % 60, 0, 0)
    if (shift.endTime < shift.startTime) {
      end.setDate(end.getDate() + 1)
    }

    return { start, end }
  }

  /** Rejects check-in before grace window opens or after shift end. */
  private assertCheckInWindow(
    now: Date,
    date: Date,
    shift: IAttendanceShiftDTO | null,
  ): void {
    if (!shift) return

    const { start, end } = this.getShiftDateTimes(date, shift)
    const windowStart = new Date(start)
    windowStart.setMinutes(windowStart.getMinutes() - this.getWindowMinutes(shift))

    if (now.getTime() < windowStart.getTime()) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_IN_TOO_EARLY,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    if (now.getTime() > end.getTime()) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_IN_TOO_LATE,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }
  }

  /** True when checkout is attempted before the allowed checkout window opens. */
  private isBeforeCheckOutWindow(
    now: Date,
    record: IAttendanceRecordDTO,
    shift: IAttendanceShiftDTO | null | undefined,
  ): boolean {
    if (!shift) return false

    const { end } = this.getShiftDateTimes(new Date(record.date), shift)
    const windowStart = new Date(end)
    windowStart.setMinutes(windowStart.getMinutes() - this.getWindowMinutes(shift))

    return now.getTime() < windowStart.getTime()
  }

  /** Allows checkout on the morning after an overnight shift using the previous day's open record. */
  private isWithinOvernightCarryover(
    now: Date,
    record: IAttendanceRecordDTO,
    shift: IAttendanceShiftDTO | null | undefined,
  ): boolean {
    if (!this.isOvernightShift(shift)) return false

    const { end } = this.getShiftDateTimes(new Date(record.date), shift)
    const latestCheckoutAt = new Date(end)
    latestCheckoutAt.setMinutes(
      latestCheckoutAt.getMinutes() + this.getShiftDurationMinutes(shift.startTime, shift.endTime),
    )

    return now.getTime() <= latestCheckoutAt.getTime()
  }

  /** Returns today's open record, or yesterday's when still inside overnight carryover. */
  private async findActiveAttendanceRecord(
    employeeId: string,
    now: Date,
  ): Promise<IAttendanceRecordDTO | null> {
    const today = this.normalizeDate(now)
    const todayRecord = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today)
    if (todayRecord?.checkInAt) return todayRecord

    const previousDate = new Date(today)
    previousDate.setDate(previousDate.getDate() - 1)
    const previousRecord = await this.attendanceRepo.findByEmployeeAndDate(employeeId, previousDate)
    const previousShift = previousRecord?.employeeShift?.shift

    if (
      previousRecord?.checkInAt &&
      this.isWithinOvernightCarryover(now, previousRecord, previousShift)
    ) {
      return previousRecord
    }

    return todayRecord
  }

  /** Converts degrees to radians for Haversine distance calculation. */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / ATTENDANCE_GPS_RULES.DEGREES_TO_RADIANS_DIVISOR
  }

  /** Computes great-circle distance between two GPS coordinates in meters. */
  private getDistanceMeters(
    first: { lat: number; lng: number },
    second: { lat: number; lng: number },
  ): number {
    const latDelta = this.toRadians(second.lat - first.lat)
    const lngDelta = this.toRadians(second.lng - first.lng)
    const firstLat = this.toRadians(first.lat)
    const secondLat = this.toRadians(second.lat)
    const chord =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2

    return (
      ATTENDANCE_GPS_RULES.EARTH_RADIUS_METERS *
      2 *
      Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
    )
  }

  /** Enforces shift GPS radius when coordinates are configured; skips when shift has no geofence. */
  private assertWithinShiftGps(
    location: { lat: number; lng: number },
    shift: IAttendanceShiftDTO | null | undefined,
  ): void {
    if (!shift || shift.gpsLat == null || shift.gpsLng == null || shift.gpsRadiusMeters == null) {
      return
    }

    const distanceMeters = this.getDistanceMeters(location, {
      lat: shift.gpsLat,
      lng: shift.gpsLng,
    })

    if (distanceMeters > shift.gpsRadiusMeters) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.OUTSIDE_GPS_RADIUS,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }
  }

  /**
   * Computes attendance metrics (status, late minutes, early leave, overtime, etc.) based on record and shift.
   * @param record - The attendance record.
   * @param shift - The associated shift definition.
   * @returns Computed attendance metrics.
   */
  private computeAttendanceMetrics(
    record: IAttendanceRecordDTO,
    shift: IAttendanceShiftDTO | null | undefined,
    checkOutAt: Date,
  ): IAttendanceMetricsDTO {
    if (!record.checkInAt) {
      return { status: ATTENDANCE_STATUS.ABSENT, totalWorkMinutes: 0 }
    }

    const checkInAt = new Date(record.checkInAt)
    const totalWorkMinutes = Math.max(
      0,
      Math.round(
        (checkOutAt.getTime() - checkInAt.getTime()) /
          ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
      ),
    )

    if (!shift) {
      return {
        status: ATTENDANCE_STATUS.ON_TIME,
        totalWorkMinutes,
      }
    }

    const gracePeriod = shift.gracePeriodMinutes ?? 0
    const { start: scheduledStart, end: scheduledEnd } = this.getShiftDateTimes(
      new Date(record.date),
      shift,
    )

    let lateMinutes = 0
    let earlyLeaveMinutes = 0
    let overtimeMinutes = 0

    const minutesLate = Math.max(
      0,
      Math.round(
        (checkInAt.getTime() - scheduledStart.getTime()) /
          ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
      ) - gracePeriod,
    )
    if (minutesLate > 0) {
      lateMinutes = minutesLate
    }

    const minutesEarly = Math.max(
      0,
      Math.round(
        (scheduledEnd.getTime() - checkOutAt.getTime()) /
          ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
      ),
    )
    if (minutesEarly > 0) {
      earlyLeaveMinutes = minutesEarly
    }

    if (checkOutAt.getTime() > scheduledEnd.getTime()) {
      overtimeMinutes = Math.max(
        0,
        Math.round(
          (checkOutAt.getTime() - scheduledEnd.getTime()) /
            ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
        ),
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
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const today = this.normalizeDate(now)
    const existingRecord = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today)

    if (existingRecord?.checkInAt) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
        HttpStatusCode.CONFLICT,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    let employeeShift = await this.employeeShiftRepo.getShiftForEmployeeDate(employeeId, today)
    let shiftId = employeeShift?.shiftId

    if (!shiftId) {
      const schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, today)
      shiftId = this.resolveShiftIdFromSchedule(schedule, today)
    }

    if (!shiftId) {
      shiftId = await this.resolveFallbackShiftId(now)
    }

    const shift = shiftId ? await this.workingShiftRepo.findById(shiftId) : null
    this.assertCheckInWindow(now, today, shift)
    this.assertWithinShiftGps(location, shift)

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
  async checkOut(
    employeeId: string,
    location: { lat: number; lng: number },
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const record = await this.findActiveAttendanceRecord(employeeId, now)

    if (!record || !record.checkInAt) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_BEFORE_IN,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    const shift = record.employeeShift?.shift
    if (this.isBeforeCheckOutWindow(now, record, shift)) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
        HttpStatusCode.BAD_REQUEST,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }
    this.assertWithinShiftGps(location, shift)

    const metrics = this.computeAttendanceMetrics(record, shift, now)
    const actualStartTime = this.getMinutesFromDateTime(new Date(record.checkInAt))
    const actualEndTime = this.getMinutesFromDateTime(now)

    return this.attendanceRepo.checkOut(record.id, location, metrics, {
      actualEndTime,
      isMatched: this.isActualShiftMatched(actualStartTime, actualEndTime, shift),
    })
  }

  /**
   * Records a smart scan for the current day.
   * First valid scan check-ins. Later scans before checkout window only report existing check-in.
   */
  async scan(
    employeeId: string,
    location: { lat: number; lng: number },
    createdById: string,
  ): Promise<IAttendanceRecordDTO> {
    const now = new Date()
    const record = await this.findActiveAttendanceRecord(employeeId, now)

    if (!record || !record.checkInAt) {
      return this.checkIn(employeeId, location, createdById)
    }

    const shift = record.employeeShift?.shift
    if (!record.checkOutAt && this.isBeforeCheckOutWindow(now, record, shift)) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
        HttpStatusCode.CONFLICT,
        ATTENDANCE_LAYERS.SERVICE,
      )
    }

    return this.checkOut(employeeId, location)
  }

  /**
   * Fetches attendance records based on the provided query filters.
   * @param query - The query parameters.
   * @returns An array of attendance records.
   */
  async getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]> {
    return this.attendanceRepo.queryRecords(query)
  }
}
