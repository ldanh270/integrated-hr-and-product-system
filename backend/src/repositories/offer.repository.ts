import { Offer, OfferStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateOfferDTO, IOfferRepository } from "../types/recruitment/offer.types";
import { OFFER_STATUS } from "@/configs/entities/recruitment.config";


export class OfferRepository implements IOfferRepository {
  /**
   * Creates a new offer.
   * @param data - The offer data, including version and deadline.
   * @returns The created offer.
   */
  async create(data: CreateOfferDTO & { createdById: string; version: number; responseDeadline: Date }): Promise<Offer> {
    return prisma.offer.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Finds an offer by its ID.
   * @param id - The ID of the offer.
   * @returns The offer with its application, or null.
   */
  async findById(id: string): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        application: true,
      }
    });
  }

  /**
   * Retrieves all offers for a specific application.
   * @param applicationId - The ID of the application.
   * @returns An array of offers ordered by version descending.
   */
  async findByApplicationId(applicationId: string): Promise<Offer[]> {
    return prisma.offer.findMany({
      where: { applicationId },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Gets the latest version of an offer for a given application.
   * @param applicationId - The ID of the application.
   * @returns The latest offer, or null.
   */
  async getLatestOffer(applicationId: string): Promise<Offer | null> {
    return prisma.offer.findFirst({
      where: { applicationId },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Updates the status of an offer.
   * @param id - The ID of the offer.
   * @param status - The new offer status.
   * @param note - An optional note (e.g. for decline reason).
   * @returns The updated offer.
   */
  async updateStatus(id: string, status: OfferStatus, note?: string): Promise<Offer> {
    const updateData: Prisma.OfferUpdateInput = { status };
    
    if (status === OFFER_STATUS.SENT) {
      updateData.sentAt = new Date();
    } else if (status === OFFER_STATUS.ACCEPTED || status === OFFER_STATUS.DECLINED) {
      updateData.respondedAt = new Date();
    }
    
    if (note) {
      updateData.declineReason = note;
    }

    return prisma.offer.update({
      where: { id },
      data: updateData,
    });
  }
}
