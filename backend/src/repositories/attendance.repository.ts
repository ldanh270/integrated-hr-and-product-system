import {
  IAttendanceMetricsDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
} from "@/types/attendance.types.ts"

import { AttendanceStatus, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

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
  async checkIn(employeeId: string, location: IGpsScanDTO, employeeShiftId: string): Promise<any> {
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

    return record
  }

  /**
   * Records a check-out for an employee.
   * @param employeeId - The employee ID.
   * @param location - The GPS location of the check-out.
   * @param metrics - Optional attendance metrics.
   * @returns The updated attendance record.
   */
  async checkOut(
    employeeId: string,
    location: IGpsScanDTO,
    metrics: IAttendanceMetricsDTO = {},
  ): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: today,
      },
      take: 1,
    })

    if (records.length === 0) {
      return null // Cannot checkout if not checked in
    }

    return this.prisma.attendanceRecord.update({
      where: { id: records[0].id },
      data: {
        checkOutAt: new Date(),
        checkOutLat: location.lat,
        checkOutLng: location.lng,
        ...metrics,
      },
    })
  }

  /**
   * Finds an attendance record by employee ID and date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The attendance record or null if not found.
   */
  async findByEmployeeAndDate(employeeId: string, date: string | Date): Promise<any | null> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate },
      include: { employeeShift: true },
    })
  }

  /**
   * Queries attendance records based on filters.
   * @param query - The query parameters.
   * @returns An array of matching attendance records.
   */
  async queryRecords(query: IAttendanceRecordQueryDTO): Promise<any[]> {
    const where: Prisma.AttendanceRecordWhereInput = {}

    if (query.employeeId) where.employeeId = query.employeeId
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
      },
      orderBy: { date: "desc" },
    })
  }
}
