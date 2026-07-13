import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobDescriptionService } from "../types/recruitment/job-description.types";

/**
 * Controller class for handling JobDescription HTTP requests.
 */
export class JobDescriptionController {

  constructor(private readonly jobDescriptionService: IJobDescriptionService) {}

  /**
   * Creates or updates a job description.
   * @param req - The Express AuthRequest object, containing requisitionId in params and description in body.
   * @param res - The Express Response object.
   */
  public createOrUpdate = async (req: AuthRequest, res: Response) => {
    const requisitionId = req.params.requisitionId as string;
    // Data is validated by Zod middleware
    const data = req.body;
    
    const result = await this.jobDescriptionService.createOrUpdateDescription(requisitionId, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Retrieves a job description by its requisition ID.
   * @param req - The Express AuthRequest object, containing the requisition ID in params.
   * @param res - The Express Response object.
   */
  public getByRequisitionId = async (req: AuthRequest, res: Response) => {
    const requisitionId = req.params.requisitionId as string;
    const result = await this.jobDescriptionService.getDescriptionByRequisitionId(requisitionId);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Description not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Deletes a job description by its requisition ID.
   * @param req - The Express AuthRequest object, containing the requisition ID in params.
   * @param res - The Express Response object.
   */
  public deleteDescription = async (req: AuthRequest, res: Response) => {
    const requisitionId = req.params.requisitionId as string;
    await this.jobDescriptionService.deleteDescription(requisitionId);
    
    res.status(HttpStatusCode.OK).json({ data: { message: "Job description deleted successfully" }, error: null });
  };
}
