import { HttpStatusCode } from "@/configs/constants/http.config.ts"
import { ApiResponse, Employee, IEmployeeService } from "@/types"

import { Request, Response } from "express"

export class EmployeeController {
  constructor(private service: IEmployeeService) {}

  list = async (_req: Request, res: Response<ApiResponse<Employee[]>>) => {
    const employees = await this.service.listEmployees()
    res.status(HttpStatusCode.OK).json({ data: employees, error: null })
  }
}
