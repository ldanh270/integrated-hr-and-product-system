import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IPayslipTemplateService } from "@/types/payroll.types.ts"

import { NextFunction, Request, Response } from "express"

export class PayslipTemplateController {
  constructor(private service: IPayslipTemplateService) {
    this.listTemplates = this.listTemplates.bind(this)
    this.createTemplate = this.createTemplate.bind(this)
    this.updateTemplate = this.updateTemplate.bind(this)
    this.deleteTemplate = this.deleteTemplate.bind(this)
  }

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query
      const filter: any = {}
      if (isActive !== undefined) filter.isActive = isActive === "true"

      const templates = await this.service.listTemplates(filter)
      res.status(HttpStatusCode.OK).json({ data: templates })
    } catch (error) {
      next(error)
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user?.empId
      if (!createdById) throw new Error("Unauthorized")

      const template = await this.service.createTemplate(req.body, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: template })
    } catch (error) {
      next(error)
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const template = await this.service.updateTemplate(id, req.body)
      res.status(HttpStatusCode.OK).json({ data: template })
    } catch (error) {
      next(error)
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      await this.service.deleteTemplate(id)
      res.status(HttpStatusCode.NO_CONTENT).send()
    } catch (error) {
      next(error)
    }
  }
}
