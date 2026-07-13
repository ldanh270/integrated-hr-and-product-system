import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IExternalJobPostService } from "../types/recruitment/external-job-post.types";

/**
 * Controller class for handling ExternalJobPost HTTP requests.
 */
export class ExternalJobPostController {

  constructor(private readonly externalJobPostService: IExternalJobPostService) {}

  /**
   * Creates a new external job post.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public create = async (req: AuthRequest, res: Response) => {
    const requisitionId = req.params.requisitionId as string;
    const data = req.body;
    
    const result = await this.externalJobPostService.createExternalPost(requisitionId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves all external posts for a requisition.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public getByRequisitionId = async (req: AuthRequest, res: Response) => {
    const requisitionId = req.params.requisitionId as string;
    const result = await this.externalJobPostService.getExternalPostsByRequisition(requisitionId);
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Updates the active status of an external post.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public updateStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { isActive } = req.body;
    
    const result = await this.externalJobPostService.updateExternalPostStatus(id, isActive);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
