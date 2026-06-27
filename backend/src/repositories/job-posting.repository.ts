import { JobPosting, PostingStatus, JobPostingChannel, CandidateSource, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateJobPostingDTO, IJobPostingRepository, JobPostingFilters } from "../types/recruitment/job-posting.types";
import { POSTING_STATUS } from "@/configs/entities/recruitment.config";


export class JobPostingRepository implements IJobPostingRepository {
  async create(data: CreateJobPostingDTO & { createdById: string; requisitionId: string }): Promise<JobPosting> {
    return prisma.jobPosting.create({
      data: {
        ...data,
      },
    });
  }

  async findById(id: string): Promise<JobPosting | null> {
    return prisma.jobPosting.findUnique({
      where: { id },
      include: {
        channels: true
      }
    });
  }

  async findAll(filters?: JobPostingFilters): Promise<JobPosting[]> {
    const where: Prisma.JobPostingWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.requisitionId) {
      where.requisitionId = filters.requisitionId;
    }

    return prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { channels: true }
    });
  }

  async updateStatus(id: string, status: PostingStatus): Promise<JobPosting> {
    const updateData: Prisma.JobPostingUpdateInput = { status };
    if (status === POSTING_STATUS.CLOSED) {
      updateData.closedAt = new Date();
    }
    return prisma.jobPosting.update({
      where: { id },
      data: updateData,
    });
  }

  async addChannel(postingId: string, source: CandidateSource, url?: string): Promise<JobPostingChannel> {
    return prisma.jobPostingChannel.create({
      data: {
        postingId,
        source,
        url
      }
    });
  }
}
