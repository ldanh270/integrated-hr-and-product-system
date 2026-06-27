import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { Offer, OfferStatus, JobApplicationStatus } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateOfferDTO, IOfferRepository, IOfferService } from "../types/recruitment/offer.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";
import { OFFER_RESPONSE_DAYS, OFFER_MAX_VERSIONS } from "../configs/entities/recruitment.config";
import { emailService } from "./email.service";

export class OfferService implements IOfferService {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}

  async createOffer(employeeId: string, data: CreateOfferDTO): Promise<Offer> {
    const app = await this.applicationRepository.findById(data.applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Check existing offers to determine version
    const latestOffer = await this.offerRepository.getLatestOffer(data.applicationId);
    
    let nextVersion = 1;
    if (latestOffer) {
      if (latestOffer.status !== OfferStatus.declined) {
        throw new AppError("Cannot create a new offer unless the previous one was declined or expired", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
      }
      nextVersion = latestOffer.version + 1;
      
      if (nextVersion > OFFER_MAX_VERSIONS) {
        throw new AppError(`Maximum offer revisions (${OFFER_MAX_VERSIONS}) reached`, HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
      }
    }

    // Set validity date (e.g. 3 days from now)
    const responseDeadline = new Date();
    responseDeadline.setDate(responseDeadline.getDate() + OFFER_RESPONSE_DAYS);

    const offer = await this.offerRepository.create({
      ...data,
      createdById: employeeId,
      version: nextVersion,
      responseDeadline
    });

    // Update application status to offer_sent
    await this.applicationRepository.updateStatus(data.applicationId, JobApplicationStatus.offer_sent);

    // Send email to candidate
    if (app && app.candidate) {
      await emailService.sendOfferEmail(
        app.candidate.email, 
        app.candidate.fullName, 
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/offers/respond?id=${offer.id}`
      );
    }

    return offer;
  }

  async sendOffer(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) {
      throw new AppError("Offer not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (offer.status !== OfferStatus.draft) {
      throw new AppError("Only draft offers can be sent", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Here we would integrate with Resend to send the actual email
    // await emailService.sendOfferEmail(...)

    return this.offerRepository.updateStatus(id, OfferStatus.sent);
  }

  async respondToOffer(id: string, accept: boolean, note?: string): Promise<Offer> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) {
      throw new AppError("Offer not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (offer.status !== OfferStatus.sent) {
      throw new AppError("Can only respond to sent offers", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    if (new Date() > offer.responseDeadline!) {
      await this.offerRepository.updateStatus(id, OfferStatus.declined);
      throw new AppError("This offer has expired", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    const newStatus = accept ? OfferStatus.accepted : OfferStatus.declined;
    const updatedOffer = await this.offerRepository.updateStatus(id, newStatus, note);

    // Update application status
    if (accept) {
      await this.applicationRepository.updateStatus(offer.applicationId, JobApplicationStatus.offer_accepted);
    } else {
      // Revert to interview_passed or leave as offering so HR can decide next step
      // Wait, if they reject, we can leave it as offering so HR can issue another version
    }

    return updatedOffer;
  }

  async getOfferById(id: string): Promise<Offer | null> {
    return this.offerRepository.findById(id);
  }
}
