import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IOfferService } from "../types/recruitment/offer.types";
import { OFFER_ACTOR } from "../configs/entities/recruitment.config";

/**
 * Controller class for handling Offer HTTP requests.
 */
export class OfferController {

  constructor(private readonly offerService: IOfferService) {}

  /**
   * Creates a new offer for a candidate.
   * @param req - The Express AuthRequest object, containing HM ID in token and offer details in body.
   * @param res - The Express Response object.
   */
  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user?.empId as string;
    const data = req.body;
    
    const result = await this.offerService.createOffer(hmId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves an offer by its ID.
   * @param req - The Express AuthRequest object, containing the offer ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.offerService.getOfferById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Offer not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Sends an offer to the candidate via email.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public send = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    
    const result = await this.offerService.sendOffer(id);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Responds to an offer (accept or reject).
   * @param req - The Express AuthRequest object, containing candidate's response in the body.
   * @param res - The Express Response object.
   */
  public respond = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const data = req.body;
    
    const result = await this.offerService.respondToOffer(id, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Proposes a new salary for an offer (negotiation).
   * @param req - The Express AuthRequest object, containing proposed salary in the body.
   * @param res - The Express Response object.
   */
  public negotiate = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    // Distinguish if the request is from candidate or HR
    // In our system, if it's an authenticated HR, actor is HR. 
    // If it's a public candidate route, it should be Candidate.
    // For now, assume this is the HR route, so actor is HR.
    // Wait, the API for candidate might be public? Yes, there should be a candidate route.
    // But since this is a protected HR route, we can just assume actor = "HR"
    // However, the instructions say "Candidate and HR can negotiate".
    // I'll assume if req.user exists, it's HR, otherwise it's CANDIDATE.
    const actor = req.user ? OFFER_ACTOR.HR : OFFER_ACTOR.CANDIDATE;
    const data = req.body;
    
    const result = await this.offerService.negotiateOffer(id, actor, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
