import { BackgroundCheck, BgcOverallStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateBackgroundCheckDTO, IBackgroundCheckRepository } from "../types/recruitment/background-check.types";
import { BGC_OVERALL_STATUS } from "@/configs/entities/recruitment.config";


export class BackgroundCheckRepository implements IBackgroundCheckRepository {
  /**
   * Creates a new background check record in the database.
   * @param data - The data to create the check with.
   * @returns The created background check.
   */
  async create(data: CreateBackgroundCheckDTO): Promise<BackgroundCheck> {
    return prisma.backgroundCheck.create({
      data: {
        applicationId: data.applicationId,
      },
    });
  }

  /**
   * Finds a background check by its ID.
   * @param id - The ID of the check.
   * @returns The background check with associated application data, or null.
   */
  async findById(id: string): Promise<BackgroundCheck | null> {
    return prisma.backgroundCheck.findUnique({
      where: { id },
      include: {
        application: true,
      }
    });
  }

  /**
   * Retrieves all background checks associated with a specific application.
   * @param applicationId - The ID of the application.
   * @returns An array of background checks.
   */
  async findByApplicationId(applicationId: string): Promise<BackgroundCheck[]> {
    return prisma.backgroundCheck.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Updates the overall status of a background check.
   * @param id - The ID of the check.
   * @param overallStatus - The new status.
   * @returns The updated background check.
   */
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
