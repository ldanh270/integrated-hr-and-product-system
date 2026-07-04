import { ExternalJobPost } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateExternalJobPostDTO, IExternalJobPostRepository } from "../types/recruitment/external-job-post.types";

export class ExternalJobPostRepository implements IExternalJobPostRepository {
  /**
   * Creates a new external job post record.
   * @param requisitionId - The ID of the requisition
   * @param data - The post details (source, url)
   * @returns The newly created post record
   */
  async create(requisitionId: string, data: CreateExternalJobPostDTO): Promise<ExternalJobPost> {
    return prisma.externalJobPost.create({
      data: {
        requisitionId,
        source: data.source,
        postUrl: data.postUrl,
      },
    });
  }

  /**
   * Finds all external posts for a requisition.
   * @param requisitionId - The ID of the requisition
   * @returns List of external posts
   */
  async findByRequisitionId(requisitionId: string): Promise<ExternalJobPost[]> {
    return prisma.externalJobPost.findMany({
      where: { requisitionId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Finds an external post by ID.
   * @param id - The ID of the post
   * @returns The external post, or null
   */
  async findById(id: string): Promise<ExternalJobPost | null> {
    return prisma.externalJobPost.findUnique({
      where: { id },
    });
  }

  /**
   * Updates the active status of an external post.
   * @param id - The ID of the post
   * @param isActive - The new active status
   * @returns The updated external post
   */
  async updateStatus(id: string, isActive: boolean): Promise<ExternalJobPost> {
    return prisma.externalJobPost.update({
      where: { id },
      data: { isActive },
    });
  }
}
