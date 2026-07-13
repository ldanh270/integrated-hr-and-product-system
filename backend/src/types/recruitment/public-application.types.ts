import { JobApplication, CandidateSource } from "@prisma/client";

export interface IPublicApplicationService {
  submitApplication(data: SubmitPublicApplicationDTO): Promise<JobApplication>;
}

export type SubmitPublicApplicationDTO = {
  requisitionId: string;
  source: CandidateSource;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  notes?: string;
};
