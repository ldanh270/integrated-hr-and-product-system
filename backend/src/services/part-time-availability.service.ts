import { DAY_OF_WEEK_VALUES } from "@/configs/entities/attendance.config.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import {
  PART_TIME_AVAILABILITY_STATUS,
} from "@/configs/entities/part-time-availability.config.ts"
import { PART_TIME_AVAILABILITY_MESSAGES } from "@/configs/messages/part-time-availability.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import {
  IAssignPartTimeShiftsDTO,
  IPartTimeAvailabilityDay,
  IPartTimeAvailabilityRepository,
  IPartTimeAvailabilityService,
  IPartTimeWeeklyAvailability,
  IReviewPartTimeAvailabilityDTO,
  IUpsertPartTimeAvailabilityDTO,
} from "@/types/part-time-availability.types.ts"
import { IEmployeeShiftRepository, IWorkingShiftRepository } from "@/types/shift.types.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"
import {
  assertSubmittedForAssign,
  assertSubmittedForReview,
  normalizeAvailabilityDays,
  PART_TIME_AVAILABILITY_LAYERS,
  validateAvailabilityDays,
} from "@/utils/part-time-availability/validate-availability-days.util.ts"
import {
  getDateForWeekDay,
  isPastOrCurrentAvailabilityWeek,
  minutesToTime,
  normalizeWeekStart,
  parseTimeToMinutes,
  shiftFitsAvailabilityDay,
} from "@/utils/part-time-availability.util.ts"
import { AppError } from "@/utils/error.util.ts"

/** Part-time weekly availability: employee free-time submission and admin shift assignment. */
export class PartTimeAvailabilityService implements IPartTimeAvailabilityService {
  constructor(
    private availabilityRepo: IPartTimeAvailabilityRepository,
    private employeeRepo: IEmployeeRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    private workingShiftRepo: IWorkingShiftRepository,
  ) {}

  async getMine(employeeId: string, weekStart: string): Promise<IPartTimeWeeklyAvailability | null> {
    return this.availabilityRepo.findByEmployeeAndWeek(employeeId, normalizeWeekStart(weekStart))
  }

  async upsertMine(
    accountId: string,
    data: IUpsertPartTimeAvailabilityDTO,
  ): Promise<IPartTimeWeeklyAvailability> {
    const employeeId = await resolvePersonalEmployeeId(accountId)
    await this.assertPartTimeEmployee(employeeId)

    if (isPastOrCurrentAvailabilityWeek(data.weekStart)) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.PAST_OR_CURRENT_WEEK_NOT_ALLOWED,
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    const days = normalizeAvailabilityDays(data.days)
    validateAvailabilityDays(days)

    // Every employee save enters the assign queue immediately; client status is ignored.
    return this.availabilityRepo.upsert({
      employeeId,
      weekStart: normalizeWeekStart(data.weekStart),
      note: data.note,
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days,
    })
  }

  listForWeek(weekStart: string): Promise<IPartTimeWeeklyAvailability[]> {
    return this.availabilityRepo.listByWeek(normalizeWeekStart(weekStart))
  }

  getByEmployee(employeeId: string, weekStart: string): Promise<IPartTimeWeeklyAvailability | null> {
    return this.availabilityRepo.findByEmployeeAndWeek(employeeId, normalizeWeekStart(weekStart))
  }

  async approve(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForReview(availability.status)
    return this.availabilityRepo.updateStatus(
      availability.id,
      PART_TIME_AVAILABILITY_STATUS.APPROVED,
      data.reviewedById,
    )
  }

  async reject(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForReview(availability.status)
    if (!data.rejectReason?.trim()) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.REJECT_REASON_REQUIRED,
        HttpStatusCode.BAD_REQUEST,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
    return this.availabilityRepo.updateStatus(
      availability.id,
      PART_TIME_AVAILABILITY_STATUS.REJECTED,
      data.reviewedById,
      data.rejectReason.trim(),
    )
  }

  async assignShifts(data: IAssignPartTimeShiftsDTO): Promise<{ assigned: number; skipped: number }> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForAssign(availability.status)
    await this.assertPartTimeEmployee(availability.employeeId)

    const weekStart = normalizeWeekStart(availability.weekStart)
    const weekDates = DAY_OF_WEEK_VALUES.map((dayOfWeek) => getDateForWeekDay(weekStart, dayOfWeek))

    // Clear prior admin overrides for this week so re-assign does not leave stale days.
    await this.employeeShiftRepo.deleteOverridesForEmployeeDates(
      availability.employeeId,
      weekDates,
    )

    let assigned = 0
    let skipped = 0

    for (const item of data.assignments) {
      // Null start/end means admin marked day off — skip without error.
      if (!item.startTime || !item.endTime) {
        skipped++
        continue
      }

      const startTime = parseTimeToMinutes(item.startTime)
      const endTime = parseTimeToMinutes(item.endTime)

      if (startTime >= endTime) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.ASSIGN_INVALID_RANGE,
          HttpStatusCode.BAD_REQUEST,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      const day = availability.days.find((entry) => entry.dayOfWeek === item.dayOfWeek)

      if (!day || day.isBusyAllDay) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      if (!shiftFitsAvailabilityDay({ startTime, endTime }, day)) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      const shiftId = await this.resolveWorkingShiftId(startTime, endTime, data.createdById)
      const assignedDate = getDateForWeekDay(weekStart, item.dayOfWeek)
      await this.employeeShiftRepo.createOverrideShift({
        employeeId: availability.employeeId,
        assignedDate,
        shiftId,
        createdById: data.createdById,
      })
      assigned++
    }

    return { assigned, skipped }
  }

  private async requireAvailability(id: string): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.availabilityRepo.findById(id)
    if (!availability) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
    return availability
  }

  private async resolveWorkingShiftId(
    startTime: number,
    endTime: number,
    createdById: string,
  ): Promise<string> {
    // Reuse matching WorkingShift template, or create one for check-in windows and GPS.
    const shifts = await this.workingShiftRepo.listAll()
    const existing = shifts.find(
      (shift) => shift.startTime === startTime && shift.endTime === endTime,
    )

    if (existing) return existing.id

    const created = await this.workingShiftRepo.create({
      name: `PT ${minutesToTime(startTime)}–${minutesToTime(endTime)}`,
      startTime: minutesToTime(startTime),
      endTime: minutesToTime(endTime),
      isActive: true,
      createdById,
    })

    return created.id
  }

  private async assertPartTimeEmployee(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findById(employeeId)
    if (!employee || !isPartTimeWorkSchedule(employee)) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.NOT_PART_TIME,
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
  }

  static mapPayloadDays(
    days: Array<{
      dayOfWeek: number
      isBusyAllDay: boolean
      slots: Array<{ startTime: string; endTime: string }>
    }>,
  ): IUpsertPartTimeAvailabilityDTO["days"] {
    return days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isBusyAllDay: day.isBusyAllDay,
      slots: day.slots.map((slot) => ({
        startTime: parseTimeToMinutes(slot.startTime),
        endTime: parseTimeToMinutes(slot.endTime),
      })),
    }))
  }
}
