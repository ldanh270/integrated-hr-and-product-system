import { APPLICATION_STATUS } from "@/configs/entities/attendance.config.ts"
import { RequestCategory } from "@/configs/rules/approval.config.ts"

export interface IProcessApprovalDTO {
  id: string
  category: RequestCategory
  status: typeof APPLICATION_STATUS.APPROVED | typeof APPLICATION_STATUS.REJECTED
  processorId: string
  rejectReason?: string
}

export interface IApprovalItem {
  id: string
  category: RequestCategory
  employeeId: string
  employeeName: string
  createdAt: Date
  details: Record<string, any>
  status: string
}

export interface IApprovalService {
  getPendingApprovals(processorId: string, role: string): Promise<IApprovalItem[]>
  processApproval(dto: IProcessApprovalDTO): Promise<any>
}
