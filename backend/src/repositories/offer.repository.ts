import { Offer, OfferStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateOfferDTO, IOfferRepository, OfferWithHistory } from "../types/recruitment/offer.types";
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
  async findById(id: string): Promise<OfferWithHistory | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        application: true,
        history: {
          orderBy: { createdAt: "asc" }
        }
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
  async getLatestOffer(applicationId: string): Promise<OfferWithHistory | null> {
    return prisma.offer.findFirst({
      where: { applicationId },
      orderBy: { version: "desc" },
      include: {
        history: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  /**
   * Updates the status of an offer.
   * @param id - The ID of the offer.
   * @param status - The new offer status.
   * @returns The updated offer.
   */
  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const updateData: Prisma.OfferUpdateInput = { status };
    
    if (status === OFFER_STATUS.SENT) {
      updateData.sentAt = new Date();
    } else if (status === OFFER_STATUS.ACCEPTED || status === OFFER_STATUS.DECLINED) {
      updateData.respondedAt = new Date();
    }

    return prisma.offer.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Updates the salary of an offer.
   * @param id - The ID of the offer.
   * @param salary - The new salary.
   * @returns The updated offer.
   */
  async updateOfferSalary(id: string, salary: number): Promise<Offer> {
    return prisma.offer.update({
      where: { id },
      data: { salary },
    });
  }

  /**
   * Adds a negotiation history to an offer.
   * @param offerId - The ID of the offer.
   * @param actor - The actor who proposed the salary (CANDIDATE or HR).
   * @param salary - The proposed salary.
   * @param note - An optional note.
   * @returns The created history record.
   */
  async addHistory(offerId: string, actor: string, salary: number, note?: string) {
    return prisma.offerHistory.create({
      data: {
        offerId,
        actor,
        salary,
        note,
      },
    });
  }
}
