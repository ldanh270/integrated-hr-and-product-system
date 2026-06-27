import { BackgroundCheck, BgcOverallStatus, JobApplicationStatus } from "@prisma/client";

export interface IBackgroundCheckRepository {
  create(data: CreateBackgroundCheckDTO): Promise<BackgroundCheck>;
  findById(id: string): Promise<BackgroundCheck | null>;
  findByApplicationId(applicationId: string): Promise<BackgroundCheck[]>;
  updateStatus(id: string, overallStatus: BgcOverallStatus): Promise<BackgroundCheck>;
}

export interface IBackgroundCheckService {
  initiateCheck(applicationId: string): Promise<BackgroundCheck>;
  updateCheck(id: string, data: UpdateBackgroundCheckDTO): Promise<BackgroundCheck>;
  getCheckById(id: string): Promise<BackgroundCheck | null>;
}

export type CreateBackgroundCheckDTO = {
  applicationId: string;
};

export type UpdateBackgroundCheckDTO = {
  overallStatus: BgcOverallStatus;
};
