import { JobRequisition, RequisitionStatus, JobFamily, JobLevel } from "@prisma/client";

export interface IJobRequisitionRepository {
  create(data: CreateJobRequisitionDTO & { requestedById: string }): Promise<JobRequisition>;
  findById(id: string): Promise<JobRequisition | null>;
  findAll(filters?: JobRequisitionFilters): Promise<JobRequisition[]>;
  updateStatus(id: string, status: RequisitionStatus, meta?: { approvedById?: string, rejectReason?: string }): Promise<JobRequisition>;
  countHiredCandidates(requisitionId: string): Promise<number>;
}

export interface IJobRequisitionService {
  createRequisition(hmId: string, data: CreateJobRequisitionDTO): Promise<JobRequisition>;
  getRequisitionById(id: string): Promise<JobRequisition | null>;
  getRequisitions(filters?: JobRequisitionFilters): Promise<JobRequisition[]>;
  approveRequisition(gmId: string, id: string): Promise<JobRequisition>;
  rejectRequisition(gmId: string, id: string, reason: string): Promise<JobRequisition>;
  closeRequisition(employeeId: string, id: string): Promise<JobRequisition>;
}

export type CreateJobRequisitionDTO = {
  title: string;
  departmentName: string;
  headcountNeeded: number;
  budgetMin?: number;
  budgetMax?: number;
  jobFamily?: JobFamily;
  level?: JobLevel;
  targetStartDate?: Date;
};

export type JobRequisitionFilters = {
  status?: RequisitionStatus;
  departmentName?: string;
  requestedById?: string;
};
