import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CreateEmployeeSchemaType,
  ListEmployeesQuerySchemaType,
  UpdateEmployeeSchemaType,
  UpdateEmployeeStatusSchemaType,
} from "@/schemas/employee.schema.ts"
import { ApiResponse, Employee, IEmployeeService, PaginatedEmployeesDto } from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { Request, Response } from "express"

/**
 * Controller class to handle all HTTP request adapters for the Employee resource.
 * Interacts with the IEmployeeService to execute business rules.
 */
export class EmployeeController {
  /**
   * Initializes the controller with the Employee service dependency.
   * Uses Constructor Injection.
   * @param service Concrete implementation of IEmployeeService.
   */
  constructor(private service: IEmployeeService) {}

  /**
   * HTTP GET /employees
   * Retrieves a paginated list of employees based on query filter params.
   * @route GET /employees
   * @param req Express Request object containing query filters (page, limit, search, status, etc.)
   * @param res Express Response object returning paginated data
   */
  list = async (req: Request, res: Response<ApiResponse<PaginatedEmployeesDto>>) => {
    const query = req.query as unknown as ListEmployeesQuerySchemaType
    const paginatedEmployees = await this.service.listEmployees(query)
    res.status(HttpStatusCode.OK).json({ data: paginatedEmployees, error: null })
  }

  /**
   * HTTP GET /employees/:id
   * Retrieves a single employee by their unique ID.
   * @route GET /employees/:id
   * @param req Express Request object containing the employee ID param
   * @param res Express Response object returning the employee domain object
   */
  getOne = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const employee = await this.service.getEmployee(String(req.params.id))
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  /**
   * HTTP POST /employees
   * Handles the creation of a new employee record.
   * @route POST /employees
   * @param req Express Request object containing body details mapping to CreateEmployeeSchemaType
   * @param res Express Response object returning the newly created Employee record
   */
  create = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const data = req.body as CreateEmployeeSchemaType
    const employee = await this.service.createEmployee(data)
    res.status(HttpStatusCode.CREATED).json({ data: employee, error: null })
  }

  /**
   * HTTP PATCH /employees/:id
   * Handles updating an existing employee's details partially.
   * @route PATCH /employees/:id
   * @param req Express Request object containing ID param and partial details in body
   * @param res Express Response object returning the updated Employee record
   */
  update = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const data = req.body as UpdateEmployeeSchemaType
    const employee = await this.service.updateEmployee(String(req.params.id), data)
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  /**
   * HTTP PATCH /employees/:id/status
   * Updates an employee's employment status.
   * @route PATCH /employees/:id/status
   * @param req Express Request object containing status in body
   * @param res Express Response object returning the updated Employee record
   */
  updateStatus = async (req: Request, res: Response<ApiResponse<Employee>>) => {
    const { status } = req.body as UpdateEmployeeStatusSchemaType
    const employee = await this.service.updateStatus(String(req.params.id), status)
    if (!employee) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Employee not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: employee, error: null })
  }

  /**
   * HTTP DELETE /employees/:id
   * Handles soft deleting an employee (marks status as terminated).
   * @route DELETE /employees/:id
   * @param req Express Request object containing the employee ID param
   * @param res Express Response object returning success indication
   */
  delete = async (req: Request, res: Response<ApiResponse<boolean>>) => {
    const success = await this.service.deleteEmployee(String(req.params.id))
    if (!success) {
      throw new AppError(
        "Employee not found",
        HttpStatusCode.NOT_FOUND,
        "Controller",
        ErrorCode.NOT_FOUND,
      )
    }
    res.status(HttpStatusCode.OK).json({ data: true, error: null })
  }
}
