import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { ExternalJobPost } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateExternalJobPostDTO, IExternalJobPostRepository, IExternalJobPostService } from "../types/recruitment/external-job-post.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";

/**
 * Service handling all business logic for External Job Posts (Sourcing channels).
 */
export class ExternalJobPostService implements IExternalJobPostService {

  constructor(
    private readonly externalJobPostRepository: IExternalJobPostRepository,
    private readonly jobRequisitionRepository: IJobRequisitionRepository
  ) {}

  /**
   * Creates a new external job post.
   * Ensures the requisition exists before creating.
   * @param requisitionId - The ID of the requisition
   * @param data - The details of the post
   * @returns The newly created external post
   * @throws AppError if the associated requisition is not found
   */
  async createExternalPost(requisitionId: string, data: CreateExternalJobPostDTO): Promise<ExternalJobPost> {
    const requisition = await this.jobRequisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.externalJobPostRepository.create(requisitionId, data);
  }

  /**
   * Retrieves all external posts for a requisition.
   * @param requisitionId - The ID of the requisition
   * @returns List of external posts
   */
  async getExternalPostsByRequisition(requisitionId: string): Promise<ExternalJobPost[]> {
    return this.externalJobPostRepository.findByRequisitionId(requisitionId);
  }

  /**
   * Updates the active status of an external post.
   * @param id - The ID of the external post
   * @param isActive - The new active status
   * @returns The updated external post
   * @throws AppError if the post is not found
   */
  async updateExternalPostStatus(id: string, isActive: boolean): Promise<ExternalJobPost> {
    const post = await this.externalJobPostRepository.findById(id);
    if (!post) {
      throw new AppError("External Job Post not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    return this.externalJobPostRepository.updateStatus(id, isActive);
  }
}
