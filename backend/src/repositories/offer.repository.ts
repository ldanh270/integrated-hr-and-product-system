import { Offer, OfferStatus, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateOfferDTO, IOfferRepository } from "../types/recruitment/offer.types";

export class OfferRepository implements IOfferRepository {
  async create(data: CreateOfferDTO & { createdById: string; version: number; responseDeadline: Date }): Promise<Offer> {
    return prisma.offer.create({
      data: {
        ...data,
      },
    });
  }

  async findById(id: string): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        application: true,
      }
    });
  }

  async findByApplicationId(applicationId: string): Promise<Offer[]> {
    return prisma.offer.findMany({
      where: { applicationId },
      orderBy: { version: "desc" },
    });
  }

  async getLatestOffer(applicationId: string): Promise<Offer | null> {
    return prisma.offer.findFirst({
      where: { applicationId },
      orderBy: { version: "desc" },
    });
  }

  async updateStatus(id: string, status: OfferStatus, note?: string): Promise<Offer> {
    const updateData: Prisma.OfferUpdateInput = { status };
    
    if (status === OfferStatus.sent) {
      updateData.sentAt = new Date();
    } else if (status === OfferStatus.accepted || status === OfferStatus.declined) {
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
