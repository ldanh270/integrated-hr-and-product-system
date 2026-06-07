import { ISalaryVariableService } from "@/types/payroll.types.ts"

import { NextFunction, Request, Response } from "express"
import { z } from "zod"

const createSalaryVariableSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  value: z.number(),
  description: z.string().optional(),
})

const updateSalaryVariableSchema = createSalaryVariableSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export class SalaryVariableController {
  constructor(private readonly service: ISalaryVariableService) {}

  public listVariables = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isActive } = req.query
      const filter: { isActive?: boolean } = {}
      if (isActive !== undefined) {
        filter.isActive = isActive === "true"
      }
      const variables = await this.service.listVariables(filter)
      res.json({ data: variables, meta: null, error: null })
    } catch (error) {
      next(error)
    }
  }

  public getVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variable = await this.service.getVariable(req.params.id as string)
      res.json({ data: variable, meta: null, error: null })
    } catch (error) {
      next(error)
    }
  }

  public createVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createSalaryVariableSchema.parse(req.body)
      const createdById = (req as any).user!.id
      const variable = await this.service.createVariable(validatedData, createdById)
      res.status(201).json({ data: variable, meta: null, error: null })
    } catch (error) {
      next(error)
    }
  }

  public updateVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateSalaryVariableSchema.parse(req.body)
      const variable = await this.service.updateVariable(req.params.id as string, validatedData)
      res.json({ data: variable, meta: null, error: null })
    } catch (error) {
      next(error)
    }
  }

  public deleteVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteVariable(req.params.id as string)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
