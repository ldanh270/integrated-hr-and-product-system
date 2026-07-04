import { JobDescription } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateJobDescriptionDTO, IJobDescriptionRepository } from "../types/recruitment/job-description.types";

export class JobDescriptionRepository implements IJobDescriptionRepository {
  /**
   * Creates or updates a job description for a specific requisition.
   * @param requisitionId - The ID of the requisition
   * @param data - The job description data
   * @returns The upserted job description
   */
  async createOrUpdate(requisitionId: string, data: CreateJobDescriptionDTO): Promise<JobDescription> {
    return prisma.jobDescription.upsert({
      where: { requisitionId },
      update: {
        description: data.description,
      },
      create: {
        requisitionId,
        description: data.description,
      },
    });
  }

  /**
   * Finds a job description by its associated requisition ID.
   * @param requisitionId - The ID of the requisition
   * @returns The job description, or null
   */
  async findByRequisitionId(requisitionId: string): Promise<JobDescription | null> {
    return prisma.jobDescription.findUnique({
      where: { requisitionId },
    });
  }

  /**
   * Deletes a job description by its requisition ID.
   * @param requisitionId - The ID of the requisition
   */
  async deleteByRequisitionId(requisitionId: string): Promise<void> {
    await prisma.jobDescription.delete({
      where: { requisitionId },
    });
  }
}
