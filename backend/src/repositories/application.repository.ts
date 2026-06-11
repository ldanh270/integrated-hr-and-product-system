import { IApplicationStatus } from "@/configs/entities/attendance.config.ts"
import { IApplicationRepository, ISubmitApplicationDTO } from "@/types/attendance.types.ts"

import { ApplicationStatus, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaApplicationRepository extends BaseRepository implements IApplicationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async submit(data: ISubmitApplicationDTO): Promise<any> {
    const { employeeId, type, reason, startDate, endDate } = data
    return this.prisma.application.create({
      data: {
        employeeId,
        type: type as any, // Needs to match Prisma ApplicationType enum
        status: ApplicationStatus.pending,
        reason,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
      },
    })
  }

  async approve(id: string, status: IApplicationStatus, approvedBy: string): Promise<any | null> {
    try {
      return await this.prisma.application.update({
        where: { id },
        data: {
          status: status as ApplicationStatus,
          approvedById: approvedBy,
          approvedAt: new Date(),
        },
      })
    } catch (error) {
      return null
    }
  }

  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.prisma.application.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    })
  }
}
