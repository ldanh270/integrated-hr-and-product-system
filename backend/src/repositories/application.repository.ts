import { APPLICATION_TYPES, IApplicationStatus } from "@/configs/entities/attendance.config.ts"
import { IApplicationRepository, ISubmitApplicationDTO } from "@/types/attendance.types.ts"

import { ApplicationStatus, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaApplicationRepository extends BaseRepository implements IApplicationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const {
      employeeId,
      type,
      reason,
      note,
      startDate,
      endDate,
      workingShiftId,
      leaveDetail,
      shiftSwapDetail,
      overtimeDetail,
      regimeDetail,
      lateEarlyDetail,
    } = data

    const createData: any = {
      employeeId,
      type: type as any,
      status: ApplicationStatus.pending,
      reason,
      note,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      workingShiftId,
    }

    // Handle nested details based on type
    if (type === APPLICATION_TYPES.LEAVE.LABEL && leaveDetail) {
      createData.leaveDetail = { create: leaveDetail }
    } else if (type === APPLICATION_TYPES.OVERTIME.LABEL && overtimeDetail) {
      createData.overtimeDetail = { create: overtimeDetail }
    } else if (type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && shiftSwapDetail) {
      createData.shiftSwapDetail = { create: shiftSwapDetail }
    } else if (type === APPLICATION_TYPES.REGIME.LABEL && regimeDetail) {
      createData.regimeDetail = { create: regimeDetail }
    } else if (type === APPLICATION_TYPES.LATE_EARLY.LABEL && lateEarlyDetail) {
      createData.lateEarlyDetail = { create: lateEarlyDetail }
    }

    return this.prisma.application.create({
      data: createData,
      include: {
        leaveDetail: true,
        overtimeDetail: true,
        shiftSwapDetail: true,
        regimeDetail: true,
        lateEarlyDetail: true,
      },
    })
  }

  async approve(
    id: string,
    status: IApplicationStatus,
    approvedBy: string,
    rejectReason?: string,
  ): Promise<any | null> {
    try {
      return await this.prisma.application.update({
        where: { id },
        data: {
          status: status as ApplicationStatus,
          approvedById: approvedBy,
          approvedAt: new Date(),
          rejectReason,
        },
      })
    } catch (error) {
      return null
    }
  }

  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.application.findMany({
      where: { employeeId },
      include: {
        leaveDetail: true,
        overtimeDetail: true,
        shiftSwapDetail: true,
        regimeDetail: true,
        lateEarlyDetail: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: {
        leaveDetail: true,
        overtimeDetail: true,
        shiftSwapDetail: true,
        regimeDetail: true,
        lateEarlyDetail: true,
        employee: {
          select: {
            fullName: true,
            avatarUrl: true,
            position: true,
          },
        },
        approvedBy: {
          select: {
            fullName: true,
          },
        },
      },
    })
  }
}
