import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { Offer, OfferStatus, JobApplicationStatus } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateOfferDTO, IOfferRepository, IOfferService } from "../types/recruitment/offer.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";
import { OFFER_RESPONSE_DAYS, OFFER_MAX_VERSIONS } from "../configs/entities/recruitment.config";
import { emailService } from "./email.service";
import { JOB_APPLICATION_STATUS, OFFER_STATUS } from "@/configs/entities/recruitment.config";


/**
 * Service class for handling Offer business logic.
 */
export class OfferService implements IOfferService {

  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}


  /**
   * Creates a new job offer for a given application.
   * Automatically versions offers if previous ones were declined.
   * @param employeeId - The ID of the HR/HM creating the offer.
   * @param data - The details of the offer to create.
   * @returns The created offer record.
   * @throws AppError if the application is not found, or if max offer revisions are reached.
   */
  async createOffer(employeeId: string, data: CreateOfferDTO): Promise<Offer> {
    const app = await this.applicationRepository.findById(data.applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Check existing offers to determine version
    const latestOffer = await this.offerRepository.getLatestOffer(data.applicationId);
    
    let nextVersion = 1;
    if (latestOffer) {
      if (latestOffer.status !== OFFER_STATUS.DECLINED) {
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
    await this.applicationRepository.updateStatus(data.applicationId, JOB_APPLICATION_STATUS.OFFER_SENT);

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


  /**
   * Transitions a draft offer to sent status (representing emailing the candidate).
   * @param id - The ID of the offer to send.
   * @returns The updated offer.
   * @throws AppError if the offer is not found or not in draft status.
   */
  async sendOffer(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) {
      throw new AppError("Offer not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (offer.status !== OFFER_STATUS.DRAFT) {
      throw new AppError("Only draft offers can be sent", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    // Here we would integrate with Resend to send the actual email
    // await emailService.sendOfferEmail(...)

    return this.offerRepository.updateStatus(id, OFFER_STATUS.SENT);
  }


  /**
   * Records a candidate's response to an offer.
   * @param id - The ID of the offer.
   * @param accept - Boolean indicating if the candidate accepted the offer.
   * @param note - Optional note provided by the candidate.
   * @returns The updated offer.
   * @throws AppError if the offer is not found, not sent, or expired.
   */
  async respondToOffer(id: string, accept: boolean, note?: string): Promise<Offer> {
    const offer = await this.offerRepository.findById(id);
    if (!offer) {
      throw new AppError("Offer not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    if (offer.status !== OFFER_STATUS.SENT) {
      throw new AppError("Can only respond to sent offers", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    if (offer.responseDeadline && new Date() > offer.responseDeadline) {
      await this.offerRepository.updateStatus(id, OFFER_STATUS.DECLINED);
      throw new AppError("This offer has expired", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    const newStatus = accept ? OFFER_STATUS.ACCEPTED : OFFER_STATUS.DECLINED;
    const updatedOffer = await this.offerRepository.updateStatus(id, newStatus, note);

    // Update application status
    if (accept) {
      await this.applicationRepository.updateStatus(offer.applicationId, JOB_APPLICATION_STATUS.OFFER_ACCEPTED);
    } else {
      // Revert to interview_passed or leave as offering so HR can decide next step
      // Wait, if they reject, we can leave it as offering so HR can issue another version
    }

    return updatedOffer;
  }


  /**
   * Retrieves an offer by its ID.
   * @param id - The ID of the offer.
   * @returns The offer record if found, null otherwise.
   */
  async getOfferById(id: string): Promise<Offer | null> {
    return this.offerRepository.findById(id);
  }
}
