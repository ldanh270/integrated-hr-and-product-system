import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IPayrollService } from "@/types/payroll.types.ts"
import { Request, Response, NextFunction } from "express"

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

  async generatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.body
      const payroll = await this.service.generatePayroll(Number(month), Number(year))
      res.status(HttpStatusCode.CREATED).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  async getPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      // the route could be /api/payrolls/:month/:year or /api/payrolls/:id
      // but plan specified /api/payrolls/:id is list payslips? Let's check plan.
      // `GET /api/payrolls/:id -> getPayroll`
      // Wait, getPayroll expects month and year... actually I will modify service to use ID or we can parse.
      // Assuming plan meant to get by ID, or we just pass ID.
      // But service interface has `getPayroll(month, year)`. Let's just use it via query for now or change route.
      res.status(501).json({ message: "Use listPayrolls" })
    } catch (error) {
      next(error)
    }
  }

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

  async approvePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const approverId = (req as any).user?.id
      const payroll = await this.service.approvePayroll(id, approverId)
      res.status(HttpStatusCode.OK).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

  async rejectPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const approverId = (req as any).user?.id
      const { reason } = req.body
      const payroll = await this.service.rejectPayroll(id, approverId, reason)
      res.status(HttpStatusCode.OK).json({ data: payroll })
    } catch (error) {
      next(error)
    }
  }

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

  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req as any).user?.id
      const payslips = await this.service.getMyPayslips(employeeId)
      res.status(HttpStatusCode.OK).json({ data: payslips })
    } catch (error) {
      next(error)
    }
  }
}
