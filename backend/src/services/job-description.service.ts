import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobDescription } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateJobDescriptionDTO, IJobDescriptionRepository, IJobDescriptionService } from "../types/recruitment/job-description.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";

/**
 * Service handling all business logic for Job Descriptions.
 * This service implements the IJobDescriptionService interface.
 */
export class JobDescriptionService implements IJobDescriptionService {

  constructor(
    private readonly jobDescriptionRepository: IJobDescriptionRepository,
    private readonly jobRequisitionRepository: IJobRequisitionRepository
  ) {}

  /**
   * Creates or updates a job description for a given requisition.
   * Ensures the requisition exists before creating the description.
   * @param requisitionId - The ID of the requisition
   * @param data - The details of the job description
   * @returns The newly created or updated job description
   * @throws AppError if the associated requisition is not found
   */
  async createOrUpdateDescription(requisitionId: string, data: CreateJobDescriptionDTO): Promise<JobDescription> {
    const requisition = await this.jobRequisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.jobDescriptionRepository.createOrUpdate(requisitionId, data);
  }

  /**
   * Retrieves a specific job description by its requisition ID.
   * @param requisitionId - The ID of the requisition
   * @returns The job description if found, otherwise null
   */
  async getDescriptionByRequisitionId(requisitionId: string): Promise<JobDescription | null> {
    return this.jobDescriptionRepository.findByRequisitionId(requisitionId);
  }
}
