import {
  IAttendanceMetricsDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
} from "@/types/attendance.types.ts"

import { AttendanceStatus, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaAttendanceRepository extends BaseRepository implements IAttendanceRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

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

  async findByEmployeeAndDate(employeeId: string, date: string | Date): Promise<any | null> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate },
      include: { employeeShift: true },
    })
  }

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
      orderBy: { date: "desc" },
    })
  }
}
