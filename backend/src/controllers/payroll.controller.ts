import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthenticatedRequest } from "@/types/auth.types.ts"
import { IPayrollService } from "@/types/payroll.types.ts"

import { NextFunction, Request, Response } from "express"

export class PayrollController {
  constructor(private service: IPayrollService) {
    this.generatePayroll = this.generatePayroll.bind(this)
    this.getPayroll = this.getPayroll.bind(this)
    this.listPayrolls = this.listPayrolls.bind(this)
    this.approvePayroll = this.approvePayroll.bind(this)
    this.rejectPayroll = this.rejectPayroll.bind(this)
    this.getPayslip = this.getPayslip.bind(this)
    this.getMyPayslips = this.getMyPayslips.bind(this)
  }

  /**
   * Initialize a new payroll for a specific month and year.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async generatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year, name } = req.body
      const payroll = await this.service.generatePayroll(Number(month), Number(year), name)
      res.status(HttpStatusCode.CREATED).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for getPayroll.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const payroll = await this.service.getPayrollById(id)
      res.status(HttpStatusCode.OK).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for listPayrolls.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async listPayrolls(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, year } = req.query
      const payrolls = await this.service.listPayrolls({
        status: status as any,
        year: year ? Number(year) : undefined,
      })
      res.status(HttpStatusCode.OK).json({ data: payrolls })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Approve a payroll, changing its status to approved.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async approvePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const approverId = (req as AuthenticatedRequest).user.empId
      const payroll = await this.service.approvePayroll(id, approverId)
      res.status(HttpStatusCode.OK).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Reject a payroll and record the rejection reason.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async rejectPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const approverId = (req as AuthenticatedRequest).user.empId
      const { reason } = req.body
      const payroll = await this.service.rejectPayroll(id, approverId, reason)
      res.status(HttpStatusCode.OK).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Handle the request to retrieve detailed payslip information for an employee.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const payrollId = req.params.id as string
      const empId = req.params.empId as string
      const payslip = await this.service.getPayslip(payrollId, empId)
      res.status(HttpStatusCode.OK).json({ data: payslip })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Process business logic for getMyPayslips.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req as AuthenticatedRequest).user.empId
      const payslips = await this.service.getMyPayslips(employeeId)
      res.status(HttpStatusCode.OK).json({ data: payslips })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Handle the request to retrieve the payslip history for an employee.
   *
   * @param req - The req parameter
   * @param res - The res parameter
   * @param next - The next parameter
   * @returns Returns nothing (void)
   */
  async getEmployeePayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.params.empId as string
      // Just reuse getMyPayslips logic since it fetches payslips for a specific employeeId
      const payslips = await this.service.getMyPayslips(employeeId)
      res.status(HttpStatusCode.OK).json({ data: payslips })
    } catch (error) {
      next(error)
    }
  }
}
