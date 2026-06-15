import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthenticatedRequest } from "@/types/auth.types.ts"
import { IPayslipTemplateService } from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"

export class PayslipTemplateController {
  constructor(private service: IPayslipTemplateService) {
    this.listTemplates = this.listTemplates.bind(this)
    this.createTemplate = this.createTemplate.bind(this)
    this.updateTemplate = this.updateTemplate.bind(this)
    this.deleteTemplate = this.deleteTemplate.bind(this)
  }

  /**
   * Process business logic for listTemplates.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
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

  /**
   * Process business logic for createTemplate.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   * @throws AppError if a business logic error occurs or data is not found
   */
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as AuthenticatedRequest).user.empId
      if (!createdById)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)

      const template = await this.service.createTemplate(req.body, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: template })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for updateTemplate.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const template = await this.service.updateTemplate(id, req.body)
      res.status(HttpStatusCode.OK).json({ data: template })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a payslip template from the system.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
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
