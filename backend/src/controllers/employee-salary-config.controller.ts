import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { assignSalaryConfigSchema } from "@/schemas/payroll.schema.ts"
import { AuthenticatedRequest } from "@/types/auth.types.ts"
import { IEmployeeSalaryConfigService } from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"

/**
 * Controller for handling employee salary configuration requests.
 */
export class EmployeeSalaryConfigController {
  /**
   * Creates a new EmployeeSalaryConfigController instance.
   * @param service - The employee salary config service implementation.
   */
  constructor(private service: IEmployeeSalaryConfigService) {
    this.getActiveConfig = this.getActiveConfig.bind(this)
    this.getConfigHistory = this.getConfigHistory.bind(this)
    this.assignConfig = this.assignConfig.bind(this)
  }

  /**
   * Retrieve the active salary configuration for the employee at a specific time (defaults to current).
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getActiveConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const config = await this.service.getActiveConfig(id)
      res.status(HttpStatusCode.OK).json({ data: config })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Retrieve the configuration history for the employee.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getConfigHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const history = await this.service.getConfigHistory(id)
      res.status(HttpStatusCode.OK).json({ data: history })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Assign a new salary configuration to the employee.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   * @throws AppError if a business logic error occurs or data is not found
   */
  async assignConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const createdById = (req as AuthenticatedRequest).user.empId
      if (!createdById)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)

      const validatedData = assignSalaryConfigSchema.parse(req.body)

      const config = await this.service.assignConfig(id, validatedData, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: config })
    } catch (error) {
      next(error)
    }
  }
}
