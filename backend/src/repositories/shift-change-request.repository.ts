import { IShiftChangeRequestRepository, ISubmitShiftChangeRequestDTO } from "@/types/shift.types.ts"

import { ApplicationStatus, ApplicationType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaShiftChangeRequestRepository
  extends BaseRepository
  implements IShiftChangeRequestRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async submit(data: ISubmitShiftChangeRequestDTO): Promise<any> {
    const {
      employeeId,
      reason,
      startDate,
      endDate,
      employeeShiftId,
      swapWithEmployeeId,
      swapWithShiftId,
      workingShiftId,
    } = data

    return this.prisma.application.create({
      data: {
        employeeId,
        type: ApplicationType.shift_swap,
        status: ApplicationStatus.pending,
        reason,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        shiftSwapDetail: {
          create: {
            employeeShiftId,
            swapWithEmployeeId,
            swapWithShiftId,
            ...(workingShiftId ? { workingShiftId } : {}),
          },
        },
      },
      include: {
        shiftSwapDetail: true,
      },
    })
  }

  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.application.findMany({
      where: { employeeId, type: ApplicationType.shift_swap },
      include: {
        shiftSwapDetail: {
          include: {
            employeeShift: { include: { shift: true } },
            swapWithEmployee: { select: { id: true, fullName: true } },
            swapWithShift: { include: { shift: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: {
        shiftSwapDetail: {
          include: {
            employeeShift: { include: { shift: true } },
            swapWithEmployee: { select: { id: true, fullName: true } },
            swapWithShift: { include: { shift: true } },
          },
        },
      },
    })
  }

  async listPending(): Promise<any[]> {
    return this.prisma.application.findMany({
      where: { type: ApplicationType.shift_swap, status: ApplicationStatus.pending },
      include: {
        employee: { select: { id: true, fullName: true } },
        shiftSwapDetail: {
          include: {
            employeeShift: { include: { shift: true } },
            swapWithEmployee: { select: { id: true, fullName: true } },
            swapWithShift: { include: { shift: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }
}
