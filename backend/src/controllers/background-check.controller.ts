import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IBackgroundCheckService } from "../types/recruitment/background-check.types";

/**
 * Controller class for handling BackgroundCheck HTTP requests.
 */
export class BackgroundCheckController {

  constructor(private readonly backgroundCheckService: IBackgroundCheckService) {}

  /**
   * Initiates a new background check for a job application.
   * @param req - The Express AuthRequest object, containing the application ID in the body.
   * @param res - The Express Response object.
   */
  public initiate = async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.body;
    
    const result = await this.backgroundCheckService.initiateCheck(applicationId);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  /**
   * Retrieves a background check by its ID.
   * @param req - The Express AuthRequest object, containing the check ID in the params.
   * @param res - The Express Response object.
   */
  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.backgroundCheckService.getCheckById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Background Check not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  /**
   * Updates an existing background check.
   * @param req - The Express AuthRequest object, containing the check ID in params and update data in the body.
   * @param res - The Express Response object.
   */
  public update = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const data = req.body;
    
    const result = await this.backgroundCheckService.updateCheck(id, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
