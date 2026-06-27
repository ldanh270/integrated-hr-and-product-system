import { JobPosting, PostingStatus, JobPostingChannel, CandidateSource } from "@prisma/client";

export interface IJobPostingRepository {
  create(data: CreateJobPostingDTO & { createdById: string, requisitionId: string }): Promise<JobPosting>;
  findById(id: string): Promise<JobPosting | null>;
  findAll(filters?: JobPostingFilters): Promise<JobPosting[]>;
  updateStatus(id: string, status: PostingStatus): Promise<JobPosting>;
  addChannel(postingId: string, source: CandidateSource, url?: string): Promise<JobPostingChannel>;
}

export interface IJobPostingService {
  createPosting(employeeId: string, requisitionId: string, data: CreateJobPostingDTO): Promise<JobPosting>;
  getPostingById(id: string): Promise<JobPosting | null>;
  getPostings(filters?: JobPostingFilters): Promise<JobPosting[]>;
  updatePostingStatus(id: string, status: PostingStatus): Promise<JobPosting>;
  publishToChannel(id: string, source: CandidateSource, url?: string): Promise<JobPostingChannel>;
}

export type CreateJobPostingDTO = {
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
};

export type JobPostingFilters = {
  status?: PostingStatus;
  requisitionId?: string;
};
