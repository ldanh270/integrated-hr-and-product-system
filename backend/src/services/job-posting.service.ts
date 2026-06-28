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


  /**
   * Creates a new job posting for an open requisition.
   * @param employeeId - The ID of the employee creating the posting.
   * @param requisitionId - The ID of the associated requisition.
   * @param data - The details of the job posting.
   * @returns The created job posting record.
   * @throws AppError if the requisition is not found or not open.
   */
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


  /**
   * Retrieves a job posting by its ID.
   * @param id - The ID of the job posting.
   * @returns The job posting record if found, null otherwise.
   */
  async getPostingById(id: string): Promise<JobPosting | null> {
    return this.jobPostingRepository.findById(id);
  }


  /**
   * Retrieves all job postings, optionally filtered.
   * @param filters - The filters to apply.
   * @returns An array of job posting records.
   */
  async getPostings(filters?: JobPostingFilters): Promise<JobPosting[]> {
    return this.jobPostingRepository.findAll(filters);
  }


  /**
   * Updates the status of a job posting.
   * @param id - The ID of the job posting.
   * @param status - The new posting status.
   * @returns The updated job posting.
   * @throws AppError if the job posting is not found.
   */
  async updatePostingStatus(id: string, status: PostingStatus): Promise<JobPosting> {
    const posting = await this.jobPostingRepository.findById(id);
    if (!posting) {
      throw new AppError("Job Posting not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.jobPostingRepository.updateStatus(id, status);
  }


  /**
   * Records a publication channel for a job posting.
   * @param id - The ID of the job posting.
   * @param source - The channel source (e.g., LinkedIn, Indeed).
   * @param url - The optional URL of the published posting.
   * @returns The newly created channel record.
   * @throws AppError if the posting is not found or is closed.
   */
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
