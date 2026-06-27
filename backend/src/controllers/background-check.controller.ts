import { Response } from "express";
import { HttpStatusCode } from "../configs/system/http.config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { IBackgroundCheckService } from "../types/recruitment/background-check.types";

export class BackgroundCheckController {
  constructor(private readonly backgroundCheckService: IBackgroundCheckService) {}

  public initiate = async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.body;
    
    const result = await this.backgroundCheckService.initiateCheck(applicationId);
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null });
  };

  public getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const result = await this.backgroundCheckService.getCheckById(id);
    
    if (!result) {
      res.status(HttpStatusCode.NOT_FOUND).json({ data: null, error: { message: "Background Check not found" } });
      return;
    }
    
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };

  public update = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const data = req.body;
    
    const result = await this.backgroundCheckService.updateCheck(id, data);
    res.status(HttpStatusCode.OK).json({ data: result, error: null });
  };
}
