import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobRequisitionService } from "../types/recruitment/job-requisition.types";

/**
 * Controller class for handling JobRequisition HTTP requests.
 */
export class JobRequisitionController {

  constructor(private readonly jobRequisitionService: IJobRequisitionService) {}

  /**
   * Creates a new job requisition.
   * @param req - The Express AuthRequest object, containing the HM ID in the token and requisition data in the body.
   * @param res - The Express Response object.
   */
  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user?.empId as string;
    // Data is validated by Zod middleware
    const data = req.body;
    
    const result = await this.jobRequisitionService.createRequisition(hmId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves a job requisition by its ID.
   * @param req - The Express AuthRequest object, containing the requisition ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.jobRequisitionService.getRequisitionById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Requisition not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Retrieves all job requisitions, with optional filters.
   * @param req - The Express AuthRequest object, containing filters in the query string.
   * @param res - The Express Response object.
   */
  public getAll = async (req: AuthRequest, res: Response) => {
    // Queries like ?status=open&departmentName=IT
    const filters = req.query;
    const result = await this.jobRequisitionService.getRequisitions(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Approves a job requisition (General Manager only).
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public approve = async (req: AuthRequest, res: Response) => {
    const gmId = req.user?.empId as string;
    const id = req.params.id as string;
    const { note } = req.body || {};
    
    const result = await this.jobRequisitionService.approveRequisition(gmId, id, note);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Rejects a job requisition (General Manager only).
   * @param req - The Express AuthRequest object, containing the rejection reason in the body.
   * @param res - The Express Response object.
   */
  public reject = async (req: AuthRequest, res: Response) => {
    const gmId = req.user?.empId as string;
    const id = req.params.id as string;
    const { note } = req.body;
    
    const result = await this.jobRequisitionService.rejectRequisition(gmId, id, note);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Closes a job requisition.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public close = async (req: AuthRequest, res: Response) => {
    const empId = req.user?.empId as string;
    const id = req.params.id as string;
    
    const result = await this.jobRequisitionService.closeRequisition(empId, id);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
