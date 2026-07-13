import { JobRequisition, RequisitionStatus, JobLevel } from "@prisma/client";

export interface IJobRequisitionRepository {
  create(data: CreateJobRequisitionDTO & { requestedById: string }): Promise<JobRequisition>;
  findById(id: string): Promise<JobRequisition | null>;
  findAll(filters?: JobRequisitionFilters): Promise<JobRequisition[]>;
  updateStatus(id: string, status: RequisitionStatus, meta?: { approvedById?: string, note?: string }): Promise<JobRequisition>;
  update(id: string, data: UpdateJobRequisitionDTO): Promise<JobRequisition>;
  delete(id: string): Promise<JobRequisition>;
  countHiredCandidates(requisitionId: string): Promise<number>;
}

export interface IJobRequisitionService {
  createRequisition(hmId: string, data: CreateJobRequisitionDTO): Promise<JobRequisition>;
  getRequisitionById(id: string): Promise<JobRequisition | null>;
  getRequisitions(filters?: JobRequisitionFilters): Promise<JobRequisition[]>;
  updateRequisition(employeeId: string, id: string, data: UpdateJobRequisitionDTO): Promise<JobRequisition>;
  deleteRequisition(employeeId: string, id: string): Promise<JobRequisition>;
  approveRequisition(gmId: string, id: string, note?: string): Promise<JobRequisition>;
  rejectRequisition(gmId: string, id: string, note: string): Promise<JobRequisition>;
  closeRequisition(employeeId: string, id: string): Promise<JobRequisition>;
}

export type CreateJobRequisitionDTO = {
  title: string;
  departmentName: string;
  headcountNeeded: number;
  budgetMin?: number;
  budgetMax?: number;
  level?: JobLevel;
  targetStartDate?: Date;
};

export type UpdateJobRequisitionDTO = Partial<CreateJobRequisitionDTO>;

export type JobRequisitionFilters = {
  status?: RequisitionStatus;
  departmentName?: string;
  requestedById?: string;
};
