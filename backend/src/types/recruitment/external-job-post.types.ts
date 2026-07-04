import { ExternalJobPost, CandidateSource } from "@prisma/client";

export interface IExternalJobPostRepository {
  create(requisitionId: string, data: CreateExternalJobPostDTO): Promise<ExternalJobPost>;
  findByRequisitionId(requisitionId: string): Promise<ExternalJobPost[]>;
  findById(id: string): Promise<ExternalJobPost | null>;
  updateStatus(id: string, isActive: boolean): Promise<ExternalJobPost>;
}

export interface IExternalJobPostService {
  createExternalPost(requisitionId: string, data: CreateExternalJobPostDTO): Promise<ExternalJobPost>;
  getExternalPostsByRequisition(requisitionId: string): Promise<ExternalJobPost[]>;
  updateExternalPostStatus(id: string, isActive: boolean): Promise<ExternalJobPost>;
}

export type CreateExternalJobPostDTO = {
  source: CandidateSource;
  postUrl?: string;
};
