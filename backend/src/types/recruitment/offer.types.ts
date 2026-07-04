import { Offer, OfferStatus, OfferHistory } from "@prisma/client";

export interface IOfferRepository {
  create(data: CreateOfferDTO & { createdById: string, version: number, responseDeadline: Date }): Promise<Offer>;
  findById(id: string): Promise<OfferWithHistory | null>;
  findByApplicationId(applicationId: string): Promise<Offer[]>;
  getLatestOffer(applicationId: string): Promise<OfferWithHistory | null>;
  updateStatus(id: string, status: OfferStatus): Promise<Offer>;
  updateOfferSalary(id: string, salary: number): Promise<Offer>;
  addHistory(offerId: string, actor: string, salary: number, note?: string): Promise<OfferHistory>;
}

export interface IOfferService {
  createOffer(employeeId: string, data: CreateOfferDTO): Promise<Offer>;
  sendOffer(id: string): Promise<Offer>;
  respondToOffer(id: string, data: OfferResponseDTO): Promise<Offer>;
  negotiateOffer(id: string, actor: string, data: OfferNegotiationDTO): Promise<OfferWithHistory>;
  getOfferById(id: string): Promise<OfferWithHistory | null>;
}

export type CreateOfferDTO = {
  applicationId: string;
  position: string;
  salary: number;
  startDate: Date;
  benefits?: string;
};

export type OfferResponseDTO = {
  accept: boolean;
  note?: string;
};

export type OfferNegotiationDTO = {
  proposedSalary: number;
  note?: string;
};

export type OfferWithHistory = Offer & {
  history?: OfferHistory[];
};
