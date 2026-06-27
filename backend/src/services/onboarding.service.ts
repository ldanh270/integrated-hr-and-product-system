import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { Employee, JobApplicationStatus, Role } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { prisma } from "../libs/database";
import { HashUtil } from "../utils/hash.util";
import { ConvertToEmployeeDTO, IOnboardingService } from "../types/recruitment/onboarding.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";
import { IOfferRepository } from "../types/recruitment/offer.types";

export class OnboardingService implements IOnboardingService {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly offerRepository: IOfferRepository
  ) {}

  async convertCandidateToEmployee(applicationId: string, data: ConvertToEmployeeDTO): Promise<Employee> {
    const app = await this.applicationRepository.findById(applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (!app.candidate) {
      throw new AppError("Candidate information is missing", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    if (app.status === JobApplicationStatus.hired) {
      throw new AppError("Candidate has already been converted to an employee", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Usually they should be in pending_onboarding stage
    if (app.status !== JobApplicationStatus.pending_onboarding) {
      // Allow overriding if needed, but strict check is better
      // For now, let's just make sure they aren't rejected or closed
      if (app.status === JobApplicationStatus.rejected || app.status === JobApplicationStatus.offer_rescinded || app.status === JobApplicationStatus.candidate_withdrew) {
        throw new AppError("Cannot convert a rejected or withdrawn candidate", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }
    }

    // Get the latest accepted offer if any
    const latestOffer = await this.offerRepository.getLatestOffer(applicationId);

    // Generate basic employee info
    // Simple username generation: lowercase, remove accents, replace spaces with dot
    let username = app.candidate.fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    
    // Add a random suffix to avoid collision
    username = `${username}.${Math.floor(Math.random() * 10000)}`;

    const defaultPassword = "Password@123";
    const passwordHash = await HashUtil.hash(defaultPassword);

    // Create employee inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          fullName: app.candidate!.fullName,
          email: app.candidate!.email,
          phone: app.candidate!.phone,
          username,
          passwordHash,
          role: Role.employee,
          position: data.position || "New Hire",
          // departmentId: data.departmentId, // uncomment if department relation is added
        }
      });

      // Update application status
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: { status: JobApplicationStatus.hired }
      });

      // You could also create EmployeeSalaryConfig here if needed, using latestOffer.baseSalary

      return employee;
    });

    return result;
  }
}
