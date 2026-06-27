import { Response, Request } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobApplicationService } from "../types/recruitment/job-application.types";
import { JobApplicationStatus } from "@prisma/client";

/**
 * Controller class for handling JobApplication HTTP requests.
 */
export class JobApplicationController {
  /**
   * Executes the constructor operation.
   * Generated JSDoc documentation.
   */
  constructor(private readonly applicationService: IJobApplicationService) {}

  // This might be a public endpoint or called by HR on behalf of candidate
  public apply = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.applicationService.applyForJob(data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.applicationService.getApplicationById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Application not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public getAll = async (req: AuthRequest, res: Response) => {
    const filters = req.query;
    const result = await this.applicationService.getApplications(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public updateStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const result = await this.applicationService.updateApplicationStatus(id, status as JobApplicationStatus);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public updateKanbanOrder = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { kanbanOrder } = req.body;
    
    const result = await this.applicationService.updateKanbanOrder(id, kanbanOrder);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public reject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { reason } = req.body;
    
    const result = await this.applicationService.rejectApplication(id, reason);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
