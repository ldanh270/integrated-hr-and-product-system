import { REQUISITION_STATUS } from "@/configs/entities/recruitment.config";
import { JobRequisition, RequisitionStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateJobRequisitionDTO, IJobRequisitionRepository, JobRequisitionFilters } from "../types/recruitment/job-requisition.types";

export class JobRequisitionRepository implements IJobRequisitionRepository {
  async create(data: CreateJobRequisitionDTO & { requestedById: string }): Promise<JobRequisition> {
    return prisma.jobRequisition.create({
      data: {
        ...data,
      },
    });
  }

  async findById(id: string): Promise<JobRequisition | null> {
    return prisma.jobRequisition.findUnique({
      where: { id },
    });
  }

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
      if (meta?.approvedById) {
         updateData.approvedBy = { connect: { id: meta.approvedById } };
         updateData.approvedAt = new Date();
      }
    }

    return prisma.jobRequisition.update({
      where: { id },
      data: updateData,
    });
  }

  async countHiredCandidates(requisitionId: string): Promise<number> {
    return prisma.jobApplication.count({
      where: {
        requisitionId,
        status: "hired"
      },
    });
  }
}
