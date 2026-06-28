import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobPostingService } from "../types/recruitment/job-posting.types";
import { PostingStatus } from "@prisma/client";

/**
 * Controller class for handling JobPosting HTTP requests.
 */
export class JobPostingController {

  constructor(private readonly jobPostingService: IJobPostingService) {}

  /**
   * Creates a new job posting for a requisition.
   * @param req - The Express AuthRequest object, containing HM ID in token and posting data in body.
   * @param res - The Express Response object.
   */
  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user?.empId as string;
    const { requisitionId, ...data } = req.body;
    
    const result = await this.jobPostingService.createPosting(hmId, requisitionId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves a job posting by its ID.
   * @param req - The Express AuthRequest object, containing posting ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.jobPostingService.getPostingById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Posting not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Retrieves all job postings, optionally filtered.
   * @param req - The Express AuthRequest object, containing filters in the query.
   * @param res - The Express Response object.
   */
  public getAll = async (req: AuthRequest, res: Response) => {
    const filters = req.query;
    const result = await this.jobPostingService.getPostings(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Updates the status of a job posting.
   * @param req - The Express AuthRequest object, containing the posting ID in params and status in body.
   * @param res - The Express Response object.
   */
  public updateStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const result = await this.jobPostingService.updatePostingStatus(id, status as PostingStatus);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Adds a publication channel to a job posting.
   * @param req - The Express AuthRequest object, containing the posting ID in params and channel data in body.
   * @param res - The Express Response object.
   */
  public addChannel = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { source, url } = req.body;
    
    const result = await this.jobPostingService.publishToChannel(id, source, url);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
