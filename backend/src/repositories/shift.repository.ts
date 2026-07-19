import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
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
    return hours * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR + minutes
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
        // Undefined persists as SQL NULL, preserving legacy shifts without an unpaid break.
        breakStartTime: this.parseTime(data.breakStartTime ?? undefined),
        breakEndTime: this.parseTime(data.breakEndTime ?? undefined),
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
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.startTime !== undefined) updateData.startTime = this.parseTime(data.startTime)
    if (data.endTime !== undefined) updateData.endTime = this.parseTime(data.endTime)
    if (data.breakStartTime !== undefined) {
      // PATCH null explicitly removes an existing break; omitted leaves it unchanged.
      updateData.breakStartTime =
        data.breakStartTime === null ? null : this.parseTime(data.breakStartTime)
    }
    if (data.breakEndTime !== undefined) {
      // Both break fields are validated as a pair at the Zod boundary.
      updateData.breakEndTime =
        data.breakEndTime === null ? null : this.parseTime(data.breakEndTime)
    }
    if (data.gracePeriodMinutes !== undefined) {
      updateData.gracePeriodMinutes = data.gracePeriodMinutes
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (data.gps === null) {
      // Explicit null clears geofence — used when HR removes GPS from a shift.
      updateData.gpsLat = null
      updateData.gpsLng = null
      updateData.gpsRadiusMeters = null
    } else if (data.gps) {
      updateData.gpsLat = data.gps.lat
      updateData.gpsLng = data.gps.lng
      updateData.gpsRadiusMeters = data.gps.radiusMeters
    }

    return this.prisma.workingShift.update({
      where: { id },
      data: updateData,
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
