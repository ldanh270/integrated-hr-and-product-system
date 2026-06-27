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

export class JobApplicationService implements IJobApplicationService {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly candidateRepository: ICandidateRepository,
    private readonly requisitionRepository: IJobRequisitionRepository
  ) {}

  async applyForJob(data: ApplyJobDTO): Promise<JobApplication> {
    const requisition = await this.requisitionRepository.findById(data.requisitionId);
    if (!requisition || requisition.status !== RequisitionStatus.open) {
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
      if (app.status === JobApplicationStatus.rejected && app.rejectedAt) {
        if (app.rejectedAt > sixMonthsAgo) {
          throw new AppError(`Candidate is under a ${CANDIDATE_COOLDOWN_MONTHS}-month cooldown period from a previous rejection`, HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
        }
      }
      
      // Also prevent double applying to the same requisition
      if (app.requisitionId === data.requisitionId && app.status !== JobApplicationStatus.candidate_withdrew) {
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

  async rejectApplication(id: string, reason: string): Promise<JobApplication> {
    const app = await this.applicationRepository.findById(id);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (app.status === JobApplicationStatus.rejected || app.status === JobApplicationStatus.hired) {
      throw new AppError("Cannot reject an application that is already resolved", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.applicationRepository.reject(id, reason);
  }
}
