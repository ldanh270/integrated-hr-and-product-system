import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { assignSalaryConfigSchema } from "@/schemas/payroll.schema.ts"
import { IEmployeeSalaryConfigService } from "@/types/payroll.types.ts"

import { NextFunction, Request, Response } from "express"

export class EmployeeSalaryConfigController {
  constructor(private service: IEmployeeSalaryConfigService) {
    this.getActiveConfig = this.getActiveConfig.bind(this)
    this.getConfigHistory = this.getConfigHistory.bind(this)
    this.assignConfig = this.assignConfig.bind(this)
  }

  async getActiveConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const config = await this.service.getActiveConfig(id)
      res.status(HttpStatusCode.OK).json({ data: config })
    } catch (error) {
      next(error)
    }
  }

  async getConfigHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const history = await this.service.getConfigHistory(id)
      res.status(HttpStatusCode.OK).json({ data: history })
    } catch (error) {
      next(error)
    }
  }

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
