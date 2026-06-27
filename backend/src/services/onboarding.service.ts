import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { Employee, JobApplicationStatus, Role } from "@prisma/client";
import { randomInt, randomBytes } from "crypto";
import { AppError } from "../utils/error.util";
import { prisma } from "../libs/database";
import { HashUtil } from "../utils/hash.util";
import { emailService } from "./email.service";
import { ConvertToEmployeeDTO, IOnboardingService } from "../types/recruitment/onboarding.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";
import { IOfferRepository } from "../types/recruitment/offer.types";
import { JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";


/**
 * Service class for handling Onboarding business logic.
 */
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

    if (app.status === JOB_APPLICATION_STATUS.HIRED) {
      throw new AppError("Candidate has already been converted to an employee", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Usually they should be in pending_onboarding stage
    if (app.status !== JOB_APPLICATION_STATUS.PENDING_ONBOARDING) {
      // Allow overriding if needed, but strict check is better
      // For now, let's just make sure they aren't rejected or closed
      if (app.status === JOB_APPLICATION_STATUS.REJECTED || app.status === JOB_APPLICATION_STATUS.OFFER_RESCINDED || app.status === JOB_APPLICATION_STATUS.CANDIDATE_WITHDREW) {
        throw new AppError("Cannot convert a rejected or withdrawn candidate", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }
    }

    // Get the latest accepted offer if any
    const latestOffer = await this.offerRepository.getLatestOffer(applicationId);

    // Generate basic employee info
    // Simple username generation: lowercase, remove accents, replace spaces with dot
    let usernameBase = app.candidate.fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    
    let username = usernameBase;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      username = `${usernameBase}.${randomInt(1000, 10000)}`;
      const existing = await prisma.employee.findFirst({ where: { username } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new AppError("Could not generate a unique username", HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorLayer.SERVICE);
    }

    const defaultPassword = randomBytes(8).toString("hex");
    const passwordHash = await HashUtil.hash(defaultPassword);

    // Create employee inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          fullName: app.candidate?.fullName || "Unknown",
          email: app.candidate?.email || "",
          phone: app.candidate?.phone || "",
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
        data: { status: JOB_APPLICATION_STATUS.HIRED }
      });

      // You could also create EmployeeSalaryConfig here if needed, using latestOffer.baseSalary

      return employee;
    });

    // Send the password to the candidate via email
    await emailService.sendEmail(
      app.candidate.email,
      "Welcome to the team - Your Account Details",
      `<h2>Hello ${app.candidate.fullName},</h2><p>Your account has been created.</p><p>Username: ${result.username}</p><p>Temporary Password: ${defaultPassword}</p>`
    );

    return result;
  }
}
