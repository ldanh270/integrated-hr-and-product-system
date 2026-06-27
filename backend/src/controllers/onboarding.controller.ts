import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IOnboardingService } from "../types/recruitment/onboarding.types";

export class OnboardingController {
  constructor(private readonly onboardingService: IOnboardingService) {}

  public convert = async (req: AuthRequest, res: Response) => {
    const { applicationId, ...data } = req.body;
    
    const result = await this.onboardingService.convertCandidateToEmployee(applicationId, data);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };
}
