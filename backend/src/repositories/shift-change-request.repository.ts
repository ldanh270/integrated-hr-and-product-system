import { IShiftChangeRequestRepository, ISubmitShiftChangeRequestDTO } from "@/types/shift.types.ts"

import { ApplicationStatus, ApplicationType, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for shift change requests using Prisma.
 */
export class PrismaShiftChangeRequestRepository
  extends BaseRepository
  implements IShiftChangeRequestRepository
{
  /**
   * Creates a new PrismaShiftChangeRequestRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Submits a new shift change request.
   * @param data - The request submission data.
   * @returns The created application with shift swap details.
   */
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

  /**
   * Finds all shift change requests submitted by an employee.
   * @param employeeId - The employee ID.
   * @returns An array of shift change requests.
   */
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

  /**
   * Finds a shift change request by ID.
   * @param id - The request ID.
   * @returns The shift change request or null if not found.
   */
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

  /**
   * Lists all pending shift change requests.
   * @returns An array of pending shift change requests.
   */
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
