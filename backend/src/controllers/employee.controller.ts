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

/**
 * Controller for handling employee-related requests.
 */
export class EmployeeController {
  /**
   * Creates a new EmployeeController instance.
   * @param service - The employee service implementation.
   */
  constructor(private service: IEmployeeService) {}

  /**
   * Lists employees with pagination and filtering.
   * @param req - Request object with query parameters.
   * @param res - Response object with paginated employees.
   */
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

  /**
   * Gets a single employee by ID.
   * @param req - Request object with employee ID in params.
   * @param res - Response object with employee data.
   */
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

  /**
   * Creates a new employee.
   * @param req - Request object with employee data in body.
   * @param res - Response object with created employee data.
   */
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

  /**
   * Updates an existing employee.
   * @param req - Request object with employee ID in params and updated data in body.
   * @param res - Response object with updated employee data.
   */
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

  /**
   * Updates an employee's status.
   * @param req - Request object with employee ID in params and status in body.
   * @param res - Response object with updated employee data.
   */
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
