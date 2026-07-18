import { EMPLOYEE_SHIFT_STATUS, HOLIDAY_SCOPE } from "@/configs/entities/attendance.config.ts"
import {
  ICreateHolidayDTO,
  IHolidayCalendarDTO,
  IHolidayRepository,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
} from "@/types/attendance.types.ts"
import { expandDateRange } from "@/utils/holiday/expand-date-range.util.ts"

import { HolidayScope, HolidayType, Prisma, PrismaClient, ShiftStatus } from "@prisma/client"
import { randomBytes } from "node:crypto"

import { BaseRepository } from "./base.repository.ts"

const HOLIDAY_INCLUDE = {
  position: { select: { id: true, name: true, code: true } },
  assignees: {
    include: {
      employee: { select: { id: true, fullName: true, email: true } },
    },
  },
} as const

/**
 * Prisma-backed repository for holiday calendar persistence.
 */
export class PrismaHolidayRepository extends BaseRepository implements IHolidayRepository {
  /** Creates a holiday repository backed by the injected Prisma client. */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Returns holidays matching an optional year or inclusive date range. */
  async listHolidays(query?: IListHolidaysQueryDTO): Promise<IHolidayCalendarDTO[]> {
    const where: { date?: { gte?: Date; lte?: Date } } = {}

    if (query?.year) {
      where.date = {
        gte: new Date(query.year, 0, 1),
        lte: new Date(query.year, 11, 31),
      }
    }

    if (query?.startDate || query?.endDate) {
      where.date = {
        ...(query.startDate ? { gte: this.normalizeDate(query.startDate) } : {}),
        ...(query.endDate ? { lte: this.normalizeDate(query.endDate) } : {}),
      }
    }

    return this.prisma.holidayCalendar.findMany({
      where,
      include: HOLIDAY_INCLUDE,
      orderBy: { date: "asc" },
    })
  }

  /** Creates a scoped single-day/range holiday and marks affected scheduled shifts pending. */
  async createHolidayRange(
    data: ICreateHolidayDTO,
    createdById: string,
  ): Promise<IHolidayCalendarDTO[]> {
    const startInput = data.startDate ?? data.date
    if (!startInput) throw new Error("Holiday start date is required")
    const start = this.normalizeDate(startInput)
    const end = this.normalizeDate(data.endDate ?? startInput)
    const dates = expandDateRange(start, end)
    const scope = (data.scope ?? HOLIDAY_SCOPE.ALL) as HolidayScope
    // A shared batch lets range/scoped holidays be managed as one user action.
    const batchId =
      dates.length > 1 || scope !== HOLIDAY_SCOPE.ALL ? randomBytes(12).toString("hex") : null
    const employeeIds =
      scope === HOLIDAY_SCOPE.EMPLOYEES ? [...new Set(data.employeeIds ?? [])] : []

    // Keep holiday rows, assignees, and affected shifts consistent on failure.
    return this.prisma.$transaction(async (tx) => {
      const created: IHolidayCalendarDTO[] = []

      for (const day of dates) {
        // Global dates retain the legacy one-row-per-date behavior through an upsert-like update.
        if (scope === HOLIDAY_SCOPE.ALL) {
          const existing = await tx.holidayCalendar.findFirst({
            where: { date: day, scope: HolidayScope.all },
          })
          if (existing) {
            const updated = await tx.holidayCalendar.update({
              where: { id: existing.id },
              data: {
                name: data.name,
                type: data.type as HolidayType,
                batchId,
              },
              include: HOLIDAY_INCLUDE,
            })
            created.push(updated)
            continue
          }
        }

        const row = await tx.holidayCalendar.create({
          data: {
            date: day,
            name: data.name,
            type: data.type as HolidayType,
            scope,
            positionId: scope === HOLIDAY_SCOPE.POSITION ? (data.positionId ?? null) : null,
            batchId,
            createdById,
            ...(scope === HOLIDAY_SCOPE.EMPLOYEES
              ? {
                  assignees: {
                    create: employeeIds.map((employeeId) => ({ employeeId })),
                  },
                }
              : {}),
          },
          include: HOLIDAY_INCLUDE,
        })
        created.push(row)
      }

      await this.markShiftsHolidayPending(tx, {
        scope,
        positionId: data.positionId,
        employeeIds,
        start,
        end,
      })

      return created
    })
  }

  /** Updates mutable fields of one holiday row. */
  async updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<IHolidayCalendarDTO> {
    return this.prisma.holidayCalendar.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.date ? { date: this.normalizeDate(data.date) } : {}),
        ...(data.type ? { type: data.type as HolidayType } : {}),
      },
      include: HOLIDAY_INCLUDE,
    })
  }

  /** Deletes one holiday or its complete range batch by default. */
  async deleteHoliday(id: string, deleteBatch = true): Promise<void> {
    const holiday = await this.prisma.holidayCalendar.findUnique({ where: { id } })
    if (!holiday) return

    // Range holidays default to atomic deletion to avoid leaving partial ranges behind.
    if (deleteBatch && holiday.batchId) {
      await this.prisma.holidayCalendar.deleteMany({ where: { batchId: holiday.batchId } })
      return
    }

    await this.prisma.holidayCalendar.delete({ where: { id } })
  }

  /** Checks whether the date is configured as a company-wide holiday. */
  async checkIsHoliday(date: string | Date): Promise<boolean> {
    const checkDate = this.normalizeDate(date)
    const holiday = await this.prisma.holidayCalendar.findFirst({
      where: { date: checkDate, scope: HolidayScope.all },
      select: { id: true },
    })
    return !!holiday
  }

  /** Moves affected scheduled assignments to holiday-pending without deleting audit history. */
  private async markShiftsHolidayPending(
    tx: Prisma.TransactionClient,
    options: {
      scope: HolidayScope
      positionId?: string
      employeeIds: string[]
      start: Date
      end: Date
    },
  ): Promise<void> {
    const employeeFilter =
      options.scope === HOLIDAY_SCOPE.ALL
        ? {}
        : options.scope === HOLIDAY_SCOPE.POSITION
          ? { employee: { positionId: options.positionId } }
          : { employeeId: { in: options.employeeIds } }

    // Preserve assignments for audit/planning while preventing holiday shifts from acting scheduled.
    await tx.employeeShift.updateMany({
      where: {
        ...employeeFilter,
        assignedDate: { gte: options.start, lte: options.end },
        status: ShiftStatus.scheduled,
      },
      data: { status: EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as ShiftStatus },
    })
  }

  /** Strips the time component so holiday persistence compares calendar dates only. */
  private normalizeDate(date: string | Date): Date {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    return normalizedDate
  }
}
