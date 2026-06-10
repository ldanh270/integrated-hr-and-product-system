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
    const query = listEmployeesQuerySchema.parse(req.query)
    const paginatedEmployees = await this.service.listEmployees(query)
    res.status(HttpStatusCode.OK).json({ data: paginatedEmployees, error: null })
  }

  getOne = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const employee = await this.service.getEmployee(String(req.params.id))
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  create = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const data = createEmployeeSchema.parse(req.body)
    const employee = await this.service.createEmployee(data)
    res.status(HttpStatusCode.CREATED).json({ data: employee, error: null })
  }

  update = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const data = updateEmployeeSchema.parse(req.body)
    const employee = await this.service.updateEmployee(String(req.params.id), data)
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  updateStatus = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const { status } = updateEmployeeStatusSchema.parse(req.body)
    const employee = await this.service.updateStatus(String(req.params.id), status)
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  delete = async (req: Request, res: Response<ApiResponse<boolean>>) => {
    const success = await this.service.deleteEmployee(String(req.params.id))
    if (!success) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, "Controller", "NOT_FOUND")
    }
    res.status(HttpStatusCode.OK).json({ data: true, error: null })
  }
}
