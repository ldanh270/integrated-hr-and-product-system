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
  async create(data: CreateJobApplicationDTO & { candidateId: string }): Promise<JobApplication> {
    return prisma.jobApplication.create({
      data: {
        ...data,
      },
    });
  }

  async findById(id: string): Promise<JobApplicationWithRelations | null> {
    return prisma.jobApplication.findUnique({
      where: { id },
      include: {
        candidate: true,
        requisition: true,
      }
    });
  }

  async findAll(filters?: JobApplicationFilters): Promise<JobApplicationWithRelations[]> {
    const where: Prisma.JobApplicationWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.requisitionId) {
      where.requisitionId = filters.requisitionId;
    }
    if (filters?.postingId) {
      where.postingId = filters.postingId;
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

  async findByCandidateId(candidateId: string): Promise<JobApplication[]> {
    return prisma.jobApplication.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: JobApplicationStatus): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
  }

  async updateKanbanOrder(id: string, kanbanOrder: number): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data: { kanbanOrder },
    });
  }

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
