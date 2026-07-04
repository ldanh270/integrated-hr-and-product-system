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
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public scheduleRound = async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const { requisitionId, interviewerIds, applicationIds, ...roundData } = data;
    
    const result = await this.interviewService.scheduleRound(requisitionId, roundData, interviewerIds, applicationIds);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves a specific interview round by ID.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public getRoundById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.interviewService.getRoundById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Interview Round not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Submits or updates an interview scorecard.
   * @param req - The Express AuthRequest object.
   * @param res - The Express Response object.
   */
  public submitScorecard = async (req: AuthRequest, res: Response) => {
    const interviewerId = req.user?.empId as string;
    const data = req.body;
    
    const result = await this.interviewService.submitScorecard(interviewerId, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
