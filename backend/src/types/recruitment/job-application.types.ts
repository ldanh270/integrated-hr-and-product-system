import { Candidate, JobApplication, JobApplicationStatus, CandidateSource } from "@prisma/client";

export interface ICandidateRepository {
  upsert(data: CreateCandidateDTO): Promise<Candidate>;
  findByEmailOrPhone(email: string, phone?: string): Promise<Candidate | null>;
  findById(id: string): Promise<Candidate | null>;
}

export interface IJobApplicationRepository {
  create(data: CreateJobApplicationDTO & { candidateId: string }): Promise<JobApplication>;
  findById(id: string): Promise<JobApplicationWithRelations | null>;
  findAll(filters?: JobApplicationFilters): Promise<JobApplicationWithRelations[]>;
  findByCandidateId(candidateId: string): Promise<JobApplication[]>;
  updateStatus(id: string, status: JobApplicationStatus): Promise<JobApplication>;
  updateKanbanOrder(id: string, newOrder: number): Promise<JobApplication>;
  reject(id: string, reason: string): Promise<JobApplication>;
}

export interface IJobApplicationService {
  applyForJob(data: ApplyJobDTO): Promise<JobApplication>;
  getApplicationById(id: string): Promise<JobApplicationWithRelations | null>;
  getApplications(filters?: JobApplicationFilters): Promise<JobApplicationWithRelations[]>;
  updateApplicationStatus(id: string, status: JobApplicationStatus): Promise<JobApplication>;
  updateKanbanOrder(id: string, newOrder: number): Promise<JobApplication>;
  rejectApplication(id: string, reason: string): Promise<JobApplication>;
}

export type CreateCandidateDTO = {
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
};

export type CreateJobApplicationDTO = {
  requisitionId: string;
  postingId?: string;
  source?: CandidateSource;
};

export type ApplyJobDTO = CreateCandidateDTO & CreateJobApplicationDTO;

export type JobApplicationFilters = {
  status?: JobApplicationStatus;
  requisitionId?: string;
  postingId?: string;
  candidateId?: string;
};

export type JobApplicationWithRelations = JobApplication & {
  candidate?: Candidate;
};
