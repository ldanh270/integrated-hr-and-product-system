import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IOfferService } from "../types/recruitment/offer.types";

export class OfferController {
  constructor(private readonly offerService: IOfferService) {}

  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user?.empId as string;
    const data = req.body;
    
    const result = await this.offerService.createOffer(hmId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.offerService.getOfferById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Offer not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public send = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    
    const result = await this.offerService.sendOffer(id);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public respond = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { accept, note } = req.body;
    
    const result = await this.offerService.respondToOffer(id, accept, note);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
