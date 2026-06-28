import { JobPosting, PostingStatus, JobPostingChannel, CandidateSource, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateJobPostingDTO, IJobPostingRepository, JobPostingFilters } from "../types/recruitment/job-posting.types";
import { POSTING_STATUS } from "@/configs/entities/recruitment.config";


export class JobPostingRepository implements IJobPostingRepository {
  /**
   * Creates a new job posting.
   * @param data - The job posting data.
   * @returns The created job posting.
   */
  async create(data: CreateJobPostingDTO & { createdById: string; requisitionId: string }): Promise<JobPosting> {
    return prisma.jobPosting.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Finds a job posting by its ID.
   * @param id - The ID of the posting.
   * @returns The job posting with channels, or null.
   */
  async findById(id: string): Promise<JobPosting | null> {
    return prisma.jobPosting.findUnique({
      where: { id },
      include: {
        channels: true
      }
    });
  }

  /**
   * Retrieves all job postings, optionally applying filters.
   * @param filters - The filters to apply.
   * @returns An array of job postings.
   */
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

  /**
   * Updates the status of a job posting.
   * @param id - The ID of the posting.
   * @param status - The new posting status.
   * @returns The updated job posting.
   */
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

  /**
   * Adds a publication channel to a job posting.
   * @param postingId - The ID of the posting.
   * @param source - The channel source.
   * @param url - The optional URL.
   * @returns The created job posting channel.
   */
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
