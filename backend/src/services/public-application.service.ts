import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { JobApplication, Candidate } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { IPublicApplicationService, SubmitPublicApplicationDTO } from "../types/recruitment/public-application.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";
import { prisma } from "../libs/database";
import { JOB_APPLICATION_STATUS, REQUISITION_STATUS } from "@/configs/entities/recruitment.config";

export class PublicApplicationService implements IPublicApplicationService {

  constructor(
    private readonly jobRequisitionRepository: IJobRequisitionRepository
  ) {}

  /**
   * Submits a public job application.
   * If the candidate doesn't exist (by email), it creates one.
   * Then it creates the application.
   * @param data - The application details from the public form
   * @returns The created JobApplication
   */
  async submitApplication(data: SubmitPublicApplicationDTO): Promise<JobApplication> {
    const requisition = await this.jobRequisitionRepository.findById(data.requisitionId);
    if (!requisition) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (requisition.status !== REQUISITION_STATUS.OPEN) {
      throw new AppError("Job Requisition is not open for applications", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Wrap in transaction to ensure Candidate and Application are created together
    return prisma.$transaction(async (tx) => {
      // Find or create candidate
      let candidate = await tx.candidate.findUnique({
        where: { email: data.email }
      });

      if (!candidate) {
        candidate = await tx.candidate.create({
          data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            resumeUrl: data.resumeUrl,
            linkedinUrl: data.linkedinUrl,
            notes: data.notes,
          }
        });
      } else {
        // Optionally update candidate info if new info is provided
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            phone: data.phone ?? candidate.phone,
            resumeUrl: data.resumeUrl ?? candidate.resumeUrl,
            linkedinUrl: data.linkedinUrl ?? candidate.linkedinUrl,
            notes: data.notes ?? candidate.notes,
          }
        });
      }

      // Check if application already exists
      const existingApplication = await tx.jobApplication.findFirst({
        where: {
          requisitionId: data.requisitionId,
          candidateId: candidate.id
        }
      });

      if (existingApplication) {
        throw new AppError("You have already applied for this job", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }

      // Create application
      const application = await tx.jobApplication.create({
        data: {
          requisitionId: data.requisitionId,
          candidateId: candidate.id,
          source: data.source,
          status: JOB_APPLICATION_STATUS.NEW,
        }
      });

      return application;
    });
  }
}
