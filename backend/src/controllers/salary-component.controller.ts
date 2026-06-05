import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ISalaryComponentService } from "@/types/payroll.types.ts"
import { Request, Response, NextFunction } from "express"

export class SalaryComponentController {
  constructor(private service: ISalaryComponentService) {
    this.listComponents = this.listComponents.bind(this)
    this.createComponent = this.createComponent.bind(this)
    this.updateComponent = this.updateComponent.bind(this)
    this.deleteComponent = this.deleteComponent.bind(this)
    this.validateFormula = this.validateFormula.bind(this)
  }

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

  async createComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user?.id
      if (!createdById) throw new Error("Unauthorized")

      const component = await this.service.createComponent(req.body, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: component })
    } catch (error) {
      next(error)
    }
  }

  async updateComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const component = await this.service.updateComponent(id, req.body)
      res.status(HttpStatusCode.OK).json({ data: component })
    } catch (error) {
      next(error)
    }
  }

  async deleteComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      await this.service.deleteComponent(id)
      res.status(HttpStatusCode.NO_CONTENT).send()
    } catch (error) {
      next(error)
    }
  }

  async validateFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const { formula } = req.body
      const result = await this.service.validateFormula(formula)
      if (result.valid) {
        res.status(HttpStatusCode.OK).json({ data: { valid: true } })
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          error: { message: result.error, code: "INVALID_FORMULA" },
        })
      }
    } catch (error) {
      next(error)
    }
  }
}
