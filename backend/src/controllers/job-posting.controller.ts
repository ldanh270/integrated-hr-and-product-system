import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IJobPostingService } from "../types/recruitment/job-posting.types";
import { PostingStatus } from "@prisma/client";

export class JobPostingController {
  constructor(private readonly jobPostingService: IJobPostingService) {}

  public create = async (req: AuthRequest, res: Response) => {
    const hmId = req.user!.empId;
    const { requisitionId, ...data } = req.body;
    
    const result = await this.jobPostingService.createPosting(hmId, requisitionId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.jobPostingService.getPostingById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Job Posting not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public getAll = async (req: AuthRequest, res: Response) => {
    const filters = req.query;
    const result = await this.jobPostingService.getPostings(filters);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public updateStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const result = await this.jobPostingService.updatePostingStatus(id, status as PostingStatus);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public addChannel = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { source, url } = req.body;
    
    const result = await this.jobPostingService.publishToChannel(id, source, url);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
