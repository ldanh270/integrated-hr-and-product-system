import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobPosting, PostingStatus, JobPostingChannel, CandidateSource, RequisitionStatus } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateJobPostingDTO, IJobPostingRepository, IJobPostingService, JobPostingFilters } from "../types/recruitment/job-posting.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";
import { REQUISITION_STATUS, POSTING_STATUS } from "@/configs/entities/recruitment.config";


/**
 * Service class for handling JobPosting business logic.
 */
export class JobPostingService implements IJobPostingService {

  constructor(
    private readonly jobPostingRepository: IJobPostingRepository,
    private readonly jobRequisitionRepository: IJobRequisitionRepository
  ) {}


  async createPosting(employeeId: string, requisitionId: string, data: CreateJobPostingDTO): Promise<JobPosting> {
    const requisition = await this.jobRequisitionRepository.findById(requisitionId);
    
    if (!requisition) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (requisition.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Cannot create a posting for a requisition that is not open", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.jobPostingRepository.create({
      ...data,
      createdById: employeeId,
      requisitionId,
    });
  }


  async getPostingById(id: string): Promise<JobPosting | null> {
    return this.jobPostingRepository.findById(id);
  }


  async getPostings(filters?: JobPostingFilters): Promise<JobPosting[]> {
    return this.jobPostingRepository.findAll(filters);
  }


  async updatePostingStatus(id: string, status: PostingStatus): Promise<JobPosting> {
    const posting = await this.jobPostingRepository.findById(id);
    if (!posting) {
      throw new AppError("Job Posting not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.jobPostingRepository.updateStatus(id, status);
  }


  async publishToChannel(id: string, source: CandidateSource, url?: string): Promise<JobPostingChannel> {
    const posting = await this.jobPostingRepository.findById(id);
    if (!posting) {
      throw new AppError("Job Posting not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (posting.status !== POSTING_STATUS.OPEN) {
      // Typically we only publish active postings, but it could be published while draft to test?
      // Let's restrict it to open or paused, maybe not closed.
      if (posting.status === POSTING_STATUS.CLOSED) {
         throw new AppError("Cannot publish a closed job posting", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }
    }

    return this.jobPostingRepository.addChannel(id, source, url);
  }
}
