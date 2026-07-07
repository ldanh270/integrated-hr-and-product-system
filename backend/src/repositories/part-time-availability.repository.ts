import {
  IPartTimeAvailabilityRepository,
  IPartTimeWeeklyAvailability,
  IUpsertPartTimeAvailabilityDTO,
  partTimeAvailabilityInclude,
} from "@/types/part-time-availability.types.ts"
import { PRISMA_INTERACTIVE_TRANSACTION_OPTIONS } from "@/configs/system/db.config.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"

import { PartTimeAvailabilityStatus, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

type RawAvailability = NonNullable<
  Awaited<ReturnType<PrismaClient["partTimeWeeklyAvailability"]["findFirst"]>>
> & {
  days: Array<{
    id: string
    dayOfWeek: number
    isBusyAllDay: boolean
    slots: Array<{ id: string; startTime: number; endTime: number; sortOrder: number }>
  }>
  employee?: {
    id: string
    fullName: string
    email: string
    employeeType: string
  }
}

/** Prisma persistence for part-time weekly availability (header + days + slots). */
export class PrismaPartTimeAvailabilityRepository
  extends BaseRepository
  implements IPartTimeAvailabilityRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Maps Prisma row (Date objects, nested days/slots) to API contract (ISO strings, YYYY-MM-DD weekStart). */
  private mapRecord(record: RawAvailability): IPartTimeWeeklyAvailability {
    return {
      id: record.id,
      employeeId: record.employeeId,
      weekStart: formatScheduleDateKey(new Date(record.weekStart)),
      status: record.status,
      note: record.note,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      reviewedById: record.reviewedById,
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
      rejectReason: record.rejectReason,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      days: record.days.map((day) => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        isBusyAllDay: day.isBusyAllDay,
        slots: day.slots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          sortOrder: slot.sortOrder,
        })),
      })),
      employee: record.employee,
    }
  }

  async findByEmployeeAndWeek(
    employeeId: string,
    weekStart: Date,
  ): Promise<IPartTimeWeeklyAvailability | null> {
    const record = await this.prisma.partTimeWeeklyAvailability.findUnique({
      where: {
        employeeId_weekStart: { employeeId, weekStart },
      },
      include: partTimeAvailabilityInclude,
    })

    return record ? this.mapRecord(record as RawAvailability) : null
  }

  async listByWeek(weekStart: Date): Promise<IPartTimeWeeklyAvailability[]> {
    const records = await this.prisma.partTimeWeeklyAvailability.findMany({
      where: { weekStart },
      include: partTimeAvailabilityInclude,
      orderBy: { employee: { fullName: "asc" } },
    })

    return records.map((record) => this.mapRecord(record as RawAvailability))
  }

  async findById(id: string): Promise<IPartTimeWeeklyAvailability | null> {
    const record = await this.prisma.partTimeWeeklyAvailability.findUnique({
      where: { id },
      include: partTimeAvailabilityInclude,
    })

    return record ? this.mapRecord(record as RawAvailability) : null
  }

  /**
   * Replace availability for a week: upsert header, delete all days/slots, recreate from payload.
   * Re-submit clears prior review fields so admin sees fresh submission.
   */
  async upsert(
    data: IUpsertPartTimeAvailabilityDTO & { employeeId: string },
  ): Promise<IPartTimeWeeklyAvailability> {
    const weekStart = new Date(data.weekStart)
    weekStart.setHours(0, 0, 0, 0)
    const status = (data.status ?? "submitted") as PartTimeAvailabilityStatus
    const submittedAt = status === "submitted" ? new Date() : null

    const record = await this.prisma.$transaction(async (tx) => {
      const header = await tx.partTimeWeeklyAvailability.upsert({
        where: {
          employeeId_weekStart: { employeeId: data.employeeId, weekStart },
        },
        create: {
          employeeId: data.employeeId,
          weekStart,
          status,
          note: data.note ?? null,
          submittedAt,
        },
        update: {
          status,
          note: data.note ?? null,
          submittedAt: submittedAt ?? undefined,
          // Employee re-submit resets review outcome — admin assigns directly from submitted state.
          reviewedById: null,
          reviewedAt: null,
          rejectReason: null,
        },
      })

      await tx.partTimeAvailabilityDay.deleteMany({
        where: { availabilityId: header.id },
      })

      if (data.days.length > 0) {
        const createdDays = await tx.partTimeAvailabilityDay.createManyAndReturn({
          data: data.days.map((day) => ({
            availabilityId: header.id,
            dayOfWeek: day.dayOfWeek,
            isBusyAllDay: day.isBusyAllDay,
          })),
        })

        const dayIdByWeekDay = new Map(createdDays.map((day) => [day.dayOfWeek, day.id]))
        const slotRows = data.days.flatMap((day) => {
          // Busy-all-day rows have no time slots in DB.
          if (day.isBusyAllDay) return []

          const dayId = dayIdByWeekDay.get(day.dayOfWeek)
          if (!dayId) return []

          return day.slots.map((slot, index) => ({
            dayId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            sortOrder: index,
          }))
        })

        if (slotRows.length > 0) {
          await tx.partTimeAvailabilitySlot.createMany({ data: slotRows })
        }
      }

      return tx.partTimeWeeklyAvailability.findUniqueOrThrow({
        where: { id: header.id },
        include: partTimeAvailabilityInclude,
      })
    }, PRISMA_INTERACTIVE_TRANSACTION_OPTIONS) // Extended timeout for deleteMany + createMany chain

    return this.mapRecord(record as RawAvailability)
  }

  async updateStatus(
    id: string,
    status: PartTimeAvailabilityStatus,
    reviewedById: string,
    rejectReason?: string,
  ): Promise<IPartTimeWeeklyAvailability> {
    const record = await this.prisma.partTimeWeeklyAvailability.update({
      where: { id },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date(),
        rejectReason: rejectReason ?? null,
      },
      include: partTimeAvailabilityInclude,
    })

    return this.mapRecord(record as RawAvailability)
  }
}
