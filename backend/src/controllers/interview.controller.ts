import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IInterviewService } from "../types/recruitment/interview.types";

export class InterviewController {
  constructor(private readonly interviewService: IInterviewService) {}

  public schedule = async (req: AuthRequest, res: Response) => {
    const leadInterviewerId = req.user!.empId;
    const { interviewerIds, ...data } = req.body;
    
    const result = await this.interviewService.scheduleRound(leadInterviewerId, data, interviewerIds);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.interviewService.getRoundById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Interview Round not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public submitScorecard = async (req: AuthRequest, res: Response) => {
    const interviewerId = req.user!.empId;
    const data = req.body;
    
    const result = await this.interviewService.submitScorecard(interviewerId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
