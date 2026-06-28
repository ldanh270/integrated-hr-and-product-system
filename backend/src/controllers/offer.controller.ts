import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IOfferService } from "../types/recruitment/offer.types";

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
    const { accept, note } = req.body;
    
    const result = await this.offerService.respondToOffer(id, accept, note);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
