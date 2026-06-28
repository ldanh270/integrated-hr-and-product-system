import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IOnboardingService } from "../types/recruitment/onboarding.types";

/**
 * Controller class for handling Onboarding HTTP requests.
 */
export class OnboardingController {

  constructor(private readonly onboardingService: IOnboardingService) {}

  /**
   * Converts a candidate into an employee.
   * @param req - The Express AuthRequest object, containing application ID and new employee details in the body.
   * @param res - The Express Response object.
   */
  public convert = async (req: AuthRequest, res: Response) => {
    const { applicationId, ...data } = req.body;
    
    const result = await this.onboardingService.convertCandidateToEmployee(applicationId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
