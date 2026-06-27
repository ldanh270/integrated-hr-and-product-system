import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobApplication, JobApplicationStatus, RequisitionStatus } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { 
  ApplyJobDTO, 
  ICandidateRepository, 
  IJobApplicationRepository, 
  IJobApplicationService, 
  JobApplicationFilters,
  JobApplicationWithRelations 
} from "../types/recruitment/job-application.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";
import { CANDIDATE_COOLDOWN_MONTHS } from "../configs/entities/recruitment.config";
import { REQUISITION_STATUS, JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";


/**
 * Service class for handling JobApplication business logic.
 */
export class JobApplicationService implements IJobApplicationService {

  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly candidateRepository: ICandidateRepository,
    private readonly requisitionRepository: IJobRequisitionRepository
  ) {}


  /**
   * Processes a new job application from a candidate.
   * Handles candidate profile upsertion and enforces the 6-month cooldown policy.
   *
   * @param data - The job application details (candidate info and job details)
   * @returns Returns the newly created job application
   * @throws AppError if requisition is closed, candidate is in cooldown, or already applied
   */
  async applyForJob(data: ApplyJobDTO): Promise<JobApplication> {
    const requisition = await this.requisitionRepository.findById(data.requisitionId);
    if (!requisition || requisition.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Job requisition is not active or does not exist", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Upsert candidate (create or update basic info)
    const candidate = await this.candidateRepository.upsert({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      resumeUrl: data.resumeUrl,
      linkedinUrl: data.linkedinUrl
    });

    // Check 6-month cooldown
    const pastApps = await this.applicationRepository.findByCandidateId(candidate.id);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - CANDIDATE_COOLDOWN_MONTHS);

    for (const app of pastApps) {
      if (app.status === JOB_APPLICATION_STATUS.REJECTED && app.rejectedAt) {
        if (app.rejectedAt > sixMonthsAgo) {
          throw new AppError(`Candidate is under a ${CANDIDATE_COOLDOWN_MONTHS}-month cooldown period from a previous rejection`, HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
        }
      }
      
      // Also prevent double applying to the same requisition
      if (app.requisitionId === data.requisitionId && app.status !== JOB_APPLICATION_STATUS.CANDIDATE_WITHDREW) {
        throw new AppError("Candidate has already applied to this requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }
    }

    return this.applicationRepository.create({
      candidateId: candidate.id,
      requisitionId: data.requisitionId,
      postingId: data.postingId,
      source: data.source
    });
  }


  async getApplicationById(id: string): Promise<JobApplicationWithRelations | null> {
    return this.applicationRepository.findById(id);
  }


  async getApplications(filters?: JobApplicationFilters): Promise<JobApplicationWithRelations[]> {
    return this.applicationRepository.findAll(filters);
  }


  /**
   * Updates the overall status of a job application.
   *
   * @param id - ID of the job application
   * @param status - The new application status to be applied
   * @returns Returns the updated job application
   * @throws AppError if the application is not found
   */
  async updateApplicationStatus(id: string, status: JobApplicationStatus): Promise<JobApplication> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Additional state machine validation can be added here
    // e.g. cannot move to offer_accepted if no offer exists

    return this.applicationRepository.updateStatus(id, status);
  }


  async updateKanbanOrder(id: string, newOrder: number): Promise<JobApplication> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.applicationRepository.updateKanbanOrder(id, newOrder);
  }


  /**
   * Rejects a job application, triggering the cooldown period for the candidate.
   *
   * @param id - ID of the application to reject
   * @param reason - The reason for rejection
   * @returns Returns the updated job application reflecting the rejection
   * @throws AppError if the application is not found or already resolved
   */
  async rejectApplication(id: string, reason: string): Promise<JobApplication> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (app.status === JOB_APPLICATION_STATUS.REJECTED || app.status === JOB_APPLICATION_STATUS.HIRED) {
      throw new AppError("Cannot reject an application that is already resolved", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.applicationRepository.reject(id, reason);
  }
}
