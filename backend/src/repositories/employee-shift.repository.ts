import { IEmployeeShiftRepository, IOverrideEmployeeShiftDTO } from "@/types/shift.types.ts"

import { PrismaClient, ShiftStatus } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for employee shift assignments using Prisma.
 */
export class PrismaEmployeeShiftRepository
  extends BaseRepository
  implements IEmployeeShiftRepository
{
  /**
   * Creates a new PrismaEmployeeShiftRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Overrides an employee's shift for a specific date.
   * @param data - The override data.
   * @returns The updated or created employee shift.
   */
  async overrideShift(data: IOverrideEmployeeShiftDTO): Promise<any> {
    const { employeeId, assignedDate, shiftId } = data
    const date = new Date(assignedDate)
    date.setHours(0, 0, 0, 0)

    // Using composite unique key or searching first to upsert
    const existing = await this.prisma.employeeShift.findUnique({
      where: {
        employeeId_assignedDate: {
          employeeId,
          assignedDate: date,
        },
      },
    })

    if (existing) {
      return this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          isOverride: true,
          status: ShiftStatus.scheduled,
        },
      })
    } else {
      // Need createdById if creating a new shift...
      // Since it's missing in DTO, we might just fail or use a system placeholder if allowed.
      // Assuming employeeId is acting as creator or we require createdById in override
      return this.prisma.employeeShift.create({
        data: {
          employeeId,
          assignedDate: date,
          shiftId,
          isOverride: true,
          status: ShiftStatus.scheduled,
          createdById: employeeId, // fallback
        },
      })
    }
  }

  /**
   * Gets a shift assignment for an employee on a specific date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The employee shift assignment or null if not found.
   */
  async getShiftForEmployeeDate(employeeId: string, date: string | Date): Promise<any | null> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return this.prisma.employeeShift.findUnique({
      where: {
        employeeId_assignedDate: {
          employeeId,
          assignedDate: targetDate,
        },
      },
    })
  }

  /**
   * Ensures a shift assignment exists for an employee on a specific date.
   * Updates existing assignment or creates a new one.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @param shiftId - The shift ID to assign.
   * @param createdById - The ID of the user performing the action.
   * @returns The updated or created employee shift.
   */
  async ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<any> {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const existing = await this.prisma.employeeShift.findUnique({
      where: {
        employeeId_assignedDate: {
          employeeId,
          assignedDate: targetDate,
        },
      },
    })

    if (existing) {
      return this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          isOverride: false,
          status: ShiftStatus.scheduled,
        },
      })
    }

    return this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: targetDate,
        shiftId,
        isOverride: false,
        status: ShiftStatus.scheduled,
        createdById,
      },
    })
  }
}
