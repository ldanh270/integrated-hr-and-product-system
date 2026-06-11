import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { assignSalaryConfigSchema } from "@/schemas/payroll.schema.ts"
import { IEmployeeSalaryConfigService } from "@/types/payroll.types.ts"

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
   * Gets the currently active salary configuration for an employee.
   * @param req - Request object containing employee ID in params.
   * @param res - Response object.
   * @param next - Next function.
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
   * Gets the salary configuration history for an employee.
   * @param req - Request object containing employee ID in params.
   * @param res - Response object.
   * @param next - Next function.
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
   * Assigns a new salary configuration to an employee.
   * @param req - Request object containing employee ID in params and config in body.
   * @param res - Response object.
   * @param next - Next function.
   */
  async assignConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const createdById = (req as any).user?.empId
      if (!createdById) throw new Error("Unauthorized")

      const validatedData = assignSalaryConfigSchema.parse(req.body)

      const config = await this.service.assignConfig(id, validatedData, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: config })
    } catch (error) {
      next(error)
    }
  }
}
