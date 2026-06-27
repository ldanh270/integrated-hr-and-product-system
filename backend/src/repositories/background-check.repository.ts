import { BackgroundCheck, BgcOverallStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateBackgroundCheckDTO, IBackgroundCheckRepository } from "../types/recruitment/background-check.types";
import { BGC_OVERALL_STATUS } from "@/configs/entities/recruitment.config";


export class BackgroundCheckRepository implements IBackgroundCheckRepository {
  async create(data: CreateBackgroundCheckDTO): Promise<BackgroundCheck> {
    return prisma.backgroundCheck.create({
      data: {
        applicationId: data.applicationId,
      },
    });
  }

  async findById(id: string): Promise<BackgroundCheck | null> {
    return prisma.backgroundCheck.findUnique({
      where: { id },
      include: {
        application: true,
      }
    });
  }

  async findByApplicationId(applicationId: string): Promise<BackgroundCheck[]> {
    return prisma.backgroundCheck.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, overallStatus: BgcOverallStatus): Promise<BackgroundCheck> {
    const updateData: Prisma.BackgroundCheckUpdateInput = { overallStatus };
    
    if (overallStatus === BGC_OVERALL_STATUS.PASSED || overallStatus === BGC_OVERALL_STATUS.RESCINDED) {
      updateData.completedAt = new Date();
    }

    return prisma.backgroundCheck.update({
      where: { id },
      data: updateData,
    });
  }
}
