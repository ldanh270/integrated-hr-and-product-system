import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config";
import { JobRequisition, RequisitionStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateJobRequisitionDTO, IJobRequisitionRepository, JobRequisitionFilters } from "../types/recruitment/job-requisition.types";

export class JobRequisitionRepository implements IJobRequisitionRepository {
  /**
   * Creates a new job requisition.
   * @param data - The job requisition data.
   * @returns The created job requisition.
   */
  async create(data: CreateJobRequisitionDTO & { requestedById: string }): Promise<JobRequisition> {
    return prisma.jobRequisition.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Finds a job requisition by its ID.
   * @param id - The ID of the requisition.
   * @returns The job requisition, or null.
   */
  async findById(id: string): Promise<JobRequisition | null> {
    return prisma.jobRequisition.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieves all job requisitions, optionally applying filters.
   * @param filters - The filters to apply.
   * @returns An array of job requisitions.
   */
  async findAll(filters?: JobRequisitionFilters): Promise<JobRequisition[]> {
    const where: Prisma.JobRequisitionWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.departmentName) {
      where.departmentName = {
        contains: filters.departmentName,
        mode: "insensitive",
      };
    }
    if (filters?.requestedById) {
      where.requestedById = filters.requestedById;
    }

    return prisma.jobRequisition.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Updates the status of a job requisition.
   * @param id - The ID of the requisition.
   * @param status - The new requisition status.
   * @param meta - Optional metadata such as approver ID or rejection reason.
   * @returns The updated job requisition.
   */
  async updateStatus(
    id: string, 
    status: RequisitionStatus, 
    meta?: { approvedById?: string; rejectReason?: string }
  ): Promise<JobRequisition> {
    const updateData: Prisma.JobRequisitionUpdateInput = { status };
    
    if (meta?.approvedById && status === REQUISITION_STATUS.OPEN) {
      updateData.approvedBy = { connect: { id: meta.approvedById } };
      updateData.approvedAt = new Date();
    }
    
    if (meta?.rejectReason && status === REQUISITION_STATUS.REJECTED) {
      updateData.rejectReason = meta.rejectReason;
      if (meta.approvedById) {
         updateData.approvedBy = { connect: { id: meta.approvedById } };
         updateData.approvedAt = new Date();
      }
    }

    return prisma.jobRequisition.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Counts the number of hired candidates for a given requisition.
   * @param requisitionId - The ID of the requisition.
   * @returns The number of hired candidates.
   */
  async countHiredCandidates(requisitionId: string): Promise<number> {
    return prisma.jobApplication.count({
      where: {
        requisitionId,
        status: "hired"
      },
    });
  }
}
