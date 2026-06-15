import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthenticatedRequest } from "@/types/auth.types.ts"
import { ISalaryComponentService } from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"

export class SalaryComponentController {
  constructor(private service: ISalaryComponentService) {
    this.listComponents = this.listComponents.bind(this)
    this.createComponent = this.createComponent.bind(this)
    this.updateComponent = this.updateComponent.bind(this)
    this.deleteComponent = this.deleteComponent.bind(this)
    this.validateFormula = this.validateFormula.bind(this)
  }

  /**
   * Process business logic for listComponents.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async listComponents(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, isActive } = req.query
      const filter: any = {}
      if (type) filter.type = type
      if (isActive !== undefined) filter.isActive = isActive === "true"

      const components = await this.service.listComponents(filter)
      res.status(HttpStatusCode.OK).json({ data: components })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for createComponent.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   * @throws AppError if a business logic error occurs or data is not found
   */
  async createComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as AuthenticatedRequest).user.empId
      if (!createdById)
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.CONTROLLER)

      const component = await this.service.createComponent(req.body, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: component })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for updateComponent.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async updateComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const component = await this.service.updateComponent(id, req.body)
      res.status(HttpStatusCode.OK).json({ data: component })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a salary component from the system configuration.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async deleteComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      await this.service.deleteComponent(id)
      res.status(HttpStatusCode.NO_CONTENT).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Analyze and validate the mathematical salary calculation formula.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async validateFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const { formula } = req.body
      const result = await this.service.validateFormula(formula)
      if (result.valid) {
        res.status(HttpStatusCode.OK).json({ data: { valid: true } })
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          error: { message: result.error, code: ErrorCode.INVALID_FORMULA },
        })
      }
    } catch (error) {
      next(error)
    }
  }
}
