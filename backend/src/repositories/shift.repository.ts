import {
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for managing working shifts using Prisma.
 */
export class PrismaWorkingShiftRepository
  extends BaseRepository
  implements IWorkingShiftRepository
{
  /**
   * Creates a new PrismaWorkingShiftRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Parses a time string (HH:mm) into minutes from the start of the day.
   * @param timeStr - The time string.
   * @returns The number of minutes or undefined if timeStr is not provided.
   */
  private parseTime(timeStr?: string): number | undefined {
    if (!timeStr) return undefined
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  /**
   * Creates a new working shift.
   * @param data - The shift creation data.
   * @returns The created working shift.
   */
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

  /**
   * Updates an existing working shift.
   * @param id - The shift ID.
   * @param data - The updated shift data.
   * @returns The updated working shift or null if not found.
   */
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

  /**
   * Finds a working shift by ID.
   * @param id - The shift ID.
   * @returns The working shift or null if not found.
   */
  async findById(id: string): Promise<any | null> {
    return this.prisma.workingShift.findUnique({ where: { id } })
  }

  /**
   * Lists all working shifts.
   * @returns An array of all working shifts.
   */
  async listAll(): Promise<any[]> {
    return this.prisma.workingShift.findMany({ orderBy: { createdAt: "desc" } })
  }

  /**
   * Deletes a working shift.
   * @param id - The shift ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.workingShift.delete({ where: { id } })
  }
}
