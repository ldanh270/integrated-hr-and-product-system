import { Offer, OfferStatus, JobApplicationStatus } from "@prisma/client";

export interface IOfferRepository {
  create(data: CreateOfferDTO & { createdById: string, version: number, responseDeadline: Date }): Promise<Offer>;
  findById(id: string): Promise<Offer | null>;
  findByApplicationId(applicationId: string): Promise<Offer[]>;
  getLatestOffer(applicationId: string): Promise<Offer | null>;
  updateStatus(id: string, status: OfferStatus, note?: string): Promise<Offer>;
}

export interface IOfferService {
  createOffer(employeeId: string, data: CreateOfferDTO): Promise<Offer>;
  sendOffer(id: string): Promise<Offer>;
  respondToOffer(id: string, accept: boolean, note?: string): Promise<Offer>;
  getOfferById(id: string): Promise<Offer | null>;
}

export type CreateOfferDTO = {
  applicationId: string;
  position: string;
  salary: number;
  startDate: Date;
  benefits?: string;
};
