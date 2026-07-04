import { Request, Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { IPublicApplicationService } from "../types/recruitment/public-application.types";

/**
 * Controller class for handling Public Application HTTP requests.
 */
export class PublicApplicationController {

  constructor(private readonly publicApplicationService: IPublicApplicationService) {}

  /**
   * Submits a new job application publicly.
   * @param req - The Express Request object.
   * @param res - The Express Response object.
   */
  public submit = async (req: Request, res: Response) => {
    const data = req.body;
    
    const result = await this.publicApplicationService.submitApplication(data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
