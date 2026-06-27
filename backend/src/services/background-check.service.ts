import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { BackgroundCheck, BgcOverallStatus, JobApplicationStatus } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { IBackgroundCheckRepository, IBackgroundCheckService, UpdateBackgroundCheckDTO } from "../types/recruitment/background-check.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";

export class BackgroundCheckService implements IBackgroundCheckService {
  constructor(
    private readonly backgroundCheckRepository: IBackgroundCheckRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}

  async initiateCheck(applicationId: string): Promise<BackgroundCheck> {
    const app = await this.applicationRepository.findById(applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Usually initiated after offer is accepted, or at least before onboarding
    const checks = await this.backgroundCheckRepository.findByApplicationId(applicationId);
    const hasPending = checks.some(c => c.overallStatus === BgcOverallStatus.in_progress);
    
    if (hasPending) {
      throw new AppError("A background check is already in progress for this application", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    const check = await this.backgroundCheckRepository.create({ applicationId });

    // Update application status
    await this.applicationRepository.updateStatus(applicationId, JobApplicationStatus.background_check);

    return check;
  }

  async updateCheck(id: string, data: UpdateBackgroundCheckDTO): Promise<BackgroundCheck> {
    const check = await this.backgroundCheckRepository.findById(id);
    if (!check) {
      throw new AppError("Background Check not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (check.overallStatus === BgcOverallStatus.passed || check.overallStatus === BgcOverallStatus.rescinded) {
      throw new AppError("Cannot update a completed background check", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    const updated = await this.backgroundCheckRepository.updateStatus(id, data.overallStatus);

    // If passed or failed, update application status accordingly
    if (data.overallStatus === BgcOverallStatus.passed) {
      await this.applicationRepository.updateStatus(check.applicationId, JobApplicationStatus.pending_onboarding);
    } else if (data.overallStatus === BgcOverallStatus.rescinded) {
      // Typically if background check fails, offer is rescinded
      await this.applicationRepository.updateStatus(check.applicationId, JobApplicationStatus.offer_rescinded);
      
      // We could also record the reason for rejection to enforce the 6-month cooldown
      // e.g., await this.applicationRepository.reject(check.applicationId, data.note || "Background check failed");
    }

    return updated;
  }

  async getCheckById(id: string): Promise<BackgroundCheck | null> {
    return this.backgroundCheckRepository.findById(id);
  }
}
