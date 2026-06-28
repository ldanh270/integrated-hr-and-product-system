import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IInterviewService } from "../types/recruitment/interview.types";

/**
 * Controller class for handling Interview HTTP requests.
 */
export class InterviewController {

  constructor(private readonly interviewService: IInterviewService) {}

  /**
   * Schedules a new interview round.
   * @param req - The Express AuthRequest object, containing the lead interviewer ID from the token and interview details in the body.
   * @param res - The Express Response object.
   */
  public schedule = async (req: AuthRequest, res: Response) => {
    const leadInterviewerId = req.user?.empId as string;
    const { interviewerIds, ...data } = req.body;
    
    const result = await this.interviewService.scheduleRound(leadInterviewerId, data, interviewerIds);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves an interview round by its ID.
   * @param req - The Express AuthRequest object, containing the interview round ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.interviewService.getRoundById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Interview Round not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Submits a scorecard for an interview round.
   * @param req - The Express AuthRequest object, containing the interviewer ID from the token and scorecard data in the body.
   * @param res - The Express Response object.
   */
  public submitScorecard = async (req: AuthRequest, res: Response) => {
    const interviewerId = req.user?.empId as string;
    const data = req.body;
    
    const result = await this.interviewService.submitScorecard(interviewerId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
