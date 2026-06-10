import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "@/schemas/employee.schema.ts"
import { ApiResponse, Employee, IEmployeeService, PaginatedEmployeesDto } from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { Request, Response } from "express"
import { z } from "zod"

export class EmployeeController {
  constructor(private service: IEmployeeService) {}

  list = async (req: Request, res: Response<ApiResponse<PaginatedEmployeesDto>>) => {
    try {
      const query = listEmployeesQuerySchema.parse(req.query)
      const paginatedEmployees = await this.service.listEmployees(query)
      res.status(HttpStatusCode.OK).json({ data: paginatedEmployees, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR" },
        })
      }
      throw error
    }
  }

  getOne = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    try {
      const employee = await this.service.getEmployee(String(req.params.id))
      if (!employee) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Employee not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: employee, error: null })
    } catch (error: any) {
      throw error
    }
  }

  create = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    try {
      const data = createEmployeeSchema.parse(req.body)
      const employee = await this.service.createEmployee(data)
      res.status(HttpStatusCode.CREATED).json({ data: employee, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  update = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    try {
      const data = updateEmployeeSchema.parse(req.body)
      const employee = await this.service.updateEmployee(String(req.params.id), data)
      if (!employee) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Employee not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: employee, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  updateStatus = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    try {
      const { status } = updateEmployeeStatusSchema.parse(req.body)
      const employee = await this.service.updateStatus(String(req.params.id), status)
      if (!employee) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Employee not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: employee, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }
}
