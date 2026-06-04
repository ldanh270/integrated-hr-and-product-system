import { IEmployeeShiftRepository, IOverrideEmployeeShiftDTO } from "@/types/shift.types.ts"

import { PrismaClient, ShiftStatus } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaEmployeeShiftRepository
  extends BaseRepository
  implements IEmployeeShiftRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

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
}
