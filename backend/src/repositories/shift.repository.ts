import {
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaWorkingShiftRepository
  extends BaseRepository
  implements IWorkingShiftRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private parseTime(timeStr?: string): number | undefined {
    if (!timeStr) return undefined
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  async create(data: ICreateWorkingShiftDTO): Promise<any> {
    return this.prisma.workingShift.create({
      data: {
        name: data.name,
        startTime: this.parseTime(data.startTime) as number,
        endTime: this.parseTime(data.endTime) as number,
        gracePeriodMinutes: data.gracePeriodMinutes || 0,
        gpsLat: data.gps?.lat,
        gpsLng: data.gps?.lng,
        gpsRadiusMeters: data.gps?.radiusMeters,
        isActive: data.isActive ?? true,
        createdById: data.createdById || "system", // Fallback if missing
      },
    })
  }

  async update(id: string, data: IUpdateWorkingShiftDTO): Promise<any | null> {
    return this.prisma.workingShift.update({
      where: { id },
      data: {
        name: data.name,
        startTime: this.parseTime(data.startTime),
        endTime: this.parseTime(data.endTime),
        gracePeriodMinutes: data.gracePeriodMinutes,
        gpsLat: data.gps?.lat,
        gpsLng: data.gps?.lng,
        gpsRadiusMeters: data.gps?.radiusMeters,
        isActive: data.isActive,
      },
    })
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.workingShift.findUnique({ where: { id } })
  }

  async listAll(): Promise<any[]> {
    return this.prisma.workingShift.findMany()
  }
}
