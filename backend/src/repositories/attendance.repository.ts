import {
  IAttendanceMetricsDTO,
  IAttendanceRecordDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
  IRealShiftUpsertDTO,
} from "@/types/attendance.types.ts"

import { AttendanceStatus, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

function getMinutesFromDateTime(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * Repository implementation for attendance-related data using Prisma.
 */
export class PrismaAttendanceRepository extends BaseRepository implements IAttendanceRepository {
  /**
   * Creates a new PrismaAttendanceRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Records a check-in for an employee.
   * @param employeeId - The employee ID.
   * @param location - The GPS location of the check-in.
   * @param employeeShiftId - The associated employee shift ID.
   * @returns The created or updated attendance record.
   */
  async checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    employeeShiftId: string,
  ): Promise<IAttendanceRecordDTO> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Using employeeShiftId for upsert since it is @unique
    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeShiftId },
      update: {
        checkInAt: new Date(),
        checkInLat: location.lat,
        checkInLng: location.lng,
      },
      create: {
        employeeId,
        employeeShiftId,
        date: today,
        checkInAt: new Date(),
        checkInLat: location.lat,
        checkInLng: location.lng,
        status: AttendanceStatus.absent, // Default status, will be recalculated later
      },
    })

    const checkInAt = record.checkInAt ?? new Date()
    await this.prisma.realShift.upsert({
      where: { attendanceRecordId: record.id },
      update: {
        actualStartTime: getMinutesFromDateTime(checkInAt),
        actualEndTime: null,
        isMatched: false,
      },
      create: {
        employeeId,
        attendanceRecordId: record.id,
        date: today,
        actualStartTime: getMinutesFromDateTime(checkInAt),
        isMatched: false,
      },
    })

    return record
  }

  /**
   * Records a check-out for an employee.
   * @param recordId - The attendance record ID.
   * @param location - The GPS location of the check-out.
   * @param metrics - Optional attendance metrics.
   * @returns The updated attendance record.
   */
  async checkOut(
    recordId: string,
    location: IGpsScanDTO,
    metrics: IAttendanceMetricsDTO = {},
    realShift: IRealShiftUpsertDTO = {},
  ): Promise<IAttendanceRecordDTO> {
    const checkOutAt = new Date()

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.attendanceRecord.update({
        where: { id: recordId },
        data: {
          checkOutAt,
          checkOutLat: location.lat,
          checkOutLng: location.lng,
          ...metrics,
        },
      })

      if (realShift.actualEndTime != null) {
        const checkInAt = record.checkInAt ?? checkOutAt
        // Upsert: onsite PT may check out without a pre-created RealShift row from template shift.
        await tx.realShift.upsert({
          where: { attendanceRecordId: recordId },
          update: {
            actualEndTime: realShift.actualEndTime,
            isMatched: realShift.isMatched ?? false,
          },
          create: {
            employeeId: record.employeeId,
            attendanceRecordId: recordId,
            date: record.date,
            actualStartTime: getMinutesFromDateTime(checkInAt),
            actualEndTime: realShift.actualEndTime,
            isMatched: realShift.isMatched ?? false,
          },
        })
      }

      return record
    })
  }

  /**
   * Finds an attendance record by employee ID and date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The attendance record or null if not found.
   */
  async findByEmployeeAndDate(
    employeeId: string,
    date: string | Date,
  ): Promise<IAttendanceRecordDTO | null> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate },
      include: {
        employeeShift: {
          include: {
            shift: true,
          },
        },
        realShift: true,
      },
    })
  }

  /**
   * Queries attendance records based on filters.
   * @param query - The query parameters.
   * @returns An array of matching attendance records.
   */
  async queryRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]> {
    const where: Prisma.AttendanceRecordWhereInput = {}

    if (query.employeeId) where.employeeId = query.employeeId
    if (query.employeeIds && query.employeeIds.length > 0) {
      where.employeeId = { in: query.employeeIds }
    }
    if (query.status) where.status = query.status as AttendanceStatus

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) {
        const startDate = new Date(query.startDate)
        if (!Number.isNaN(startDate.getTime())) where.date.gte = startDate
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate)
        if (!Number.isNaN(endDate.getTime())) where.date.lte = endDate
      }
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            email: true,
          },
        },
        employeeShift: {
          include: {
            shift: true,
          },
        },
        realShift: true,
        correctedByApplication: {
          include: {
            forgotCardDetail: true,
          },
        },
      },
      orderBy: { date: "desc" },
    })
  }
}
