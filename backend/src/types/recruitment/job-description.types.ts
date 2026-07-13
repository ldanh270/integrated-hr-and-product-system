import { JobDescription } from "@prisma/client";

export interface IJobDescriptionRepository {
  createOrUpdate(requisitionId: string, data: CreateJobDescriptionDTO): Promise<JobDescription>;
  findByRequisitionId(requisitionId: string): Promise<JobDescription | null>;
  deleteByRequisitionId(requisitionId: string): Promise<void>;
}

export interface IJobDescriptionService {
  createOrUpdateDescription(requisitionId: string, data: CreateJobDescriptionDTO): Promise<JobDescription>;
  getDescriptionByRequisitionId(requisitionId: string): Promise<JobDescription | null>;
  deleteDescription(requisitionId: string): Promise<void>;
}

export type CreateJobDescriptionDTO = {
  description: string;
};
