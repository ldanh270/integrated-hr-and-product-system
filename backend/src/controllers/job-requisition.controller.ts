import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobRequisitionService } from "../types/recruitment/job-requisition.types";

/**
 * Controller class for handling JobRequisition HTTP requests.
 */
export class JobRequisitionController {
  /**
   * Executes the constructor operation.
   * Generated JSDoc documentation.
   */
  constructor(private readonly jobRequisitionService: IJobRequisitionService) {}

  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user?.empId as string;
    // Data is validated by Zod middleware
    const data = req.body;
    
    const result = await this.jobRequisitionService.createRequisition(hmId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.jobRequisitionService.getRequisitionById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Requisition not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public getAll = async (req: AuthRequest, res: Response) => {
    // Queries like ?status=open&departmentName=IT
    const filters = req.query;
    const result = await this.jobRequisitionService.getRequisitions(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public approve = async (req: AuthRequest, res: Response) => {
    const gmId = req.user?.empId as string;
    const id = req.params.id as string;
    
    const result = await this.jobRequisitionService.approveRequisition(gmId, id);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public reject = async (req: AuthRequest, res: Response) => {
    const gmId = req.user?.empId as string;
    const id = req.params.id as string;
    const { reason } = req.body;
    
    const result = await this.jobRequisitionService.rejectRequisition(gmId, id, reason);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public close = async (req: AuthRequest, res: Response) => {
    const empId = req.user?.empId as string;
    const id = req.params.id as string;
    
    const result = await this.jobRequisitionService.closeRequisition(empId, id);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
