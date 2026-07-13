import { JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";
import { JobApplication, JobApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import {
  CreateJobApplicationDTO,
  IJobApplicationRepository,
  JobApplicationFilters,
  JobApplicationWithRelations,
} from "../types/recruitment/job-application.types";

export class JobApplicationRepository implements IJobApplicationRepository {
  /**
   * Creates a new job application.
   * @param data - The job application data.
   * @returns The created job application.
   */
  async create(data: CreateJobApplicationDTO & { candidateId: string }): Promise<JobApplication> {
    return prisma.jobApplication.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Retrieves a job application by its ID.
   * @param id - The ID of the job application.
   * @returns The job application with related entities, or null.
   */
  async findById(id: string): Promise<JobApplicationWithRelations | null> {
    return prisma.jobApplication.findUnique({
      where: { id },
      include: {
        candidate: true,
        requisition: true,
      }
    });
  }

  /**
   * Retrieves all job applications, optionally matching filters.
   * @param filters - The filters to apply.
   * @returns An array of job applications.
   */
  async findAll(filters?: JobApplicationFilters): Promise<JobApplicationWithRelations[]> {
    const where: Prisma.JobApplicationWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.requisitionId) {
      where.requisitionId = filters.requisitionId;
    }
    if (filters?.candidateId) {
      where.candidateId = filters.candidateId;
    }

    return prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { candidate: true }
    });
  }

  /**
   * Retrieves all applications submitted by a specific candidate.
   * @param candidateId - The ID of the candidate.
   * @returns An array of job applications.
   */
  async findByCandidateId(candidateId: string): Promise<JobApplication[]> {
    return prisma.jobApplication.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Updates the status of a job application.
   * @param id - The ID of the application.
   * @param status - The new status.
   * @returns The updated job application.
   */
  async updateStatus(id: string, status: JobApplicationStatus): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Updates the kanban order of an application.
   * @param id - The ID of the application.
   * @param kanbanOrder - The new numeric order.
   * @returns The updated job application.
   */
  async updateKanbanOrder(id: string, kanbanOrder: number): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data: { kanbanOrder },
    });
  }

  /**
   * Rejects a job application.
   * @param id - The ID of the application.
   * @param reason - The reason for rejection.
   * @returns The updated job application.
   */
  async reject(id: string, reason: string): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data: { 
        status: JOB_APPLICATION_STATUS.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason
      },
    });
  }
}
