import { Response, Request } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobApplicationService } from "../types/recruitment/job-application.types";
import { JobApplicationStatus } from "@prisma/client";

/**
 * Controller class for handling JobApplication HTTP requests.
 */
export class JobApplicationController {

  constructor(private readonly applicationService: IJobApplicationService) {}

  /**
   * Submits a new job application.
   * This might be a public endpoint or called by HR on behalf of candidate.
   * @param req - The Express Request object, containing application details in the body.
   * @param res - The Express Response object.
   */
  public apply = async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.applicationService.applyForJob(data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves a job application by its ID.
   * @param req - The Express AuthRequest object, containing the application ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.applicationService.getApplicationById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Application not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Retrieves all job applications, optionally filtered by status, requisition, etc.
   * @param req - The Express AuthRequest object, containing filters in the query.
   * @param res - The Express Response object.
   */
  public getAll = async (req: AuthRequest, res: Response) => {
    const filters = req.query;
    const result = await this.applicationService.getApplications(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Updates the status of a job application.
   * @param req - The Express AuthRequest object, containing the application ID in params and status in body.
   * @param res - The Express Response object.
   */
  public updateStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const result = await this.applicationService.updateApplicationStatus(id, status as JobApplicationStatus);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Updates the kanban order of a job application for UI reordering.
   * @param req - The Express AuthRequest object, containing the application ID in params and new kanbanOrder in body.
   * @param res - The Express Response object.
   */
  public updateKanbanOrder = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { kanbanOrder } = req.body;
    
    const result = await this.applicationService.updateKanbanOrder(id, kanbanOrder);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Rejects a job application with a reason.
   * @param req - The Express AuthRequest object, containing the application ID in params and rejection reason in body.
   * @param res - The Express Response object.
   */
  public reject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { reason } = req.body;
    
    const result = await this.applicationService.rejectApplication(id, reason);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
