import type { IApplicationStatus } from "../../config/entities/attendance.config.ts"

export interface IApprovalDetails {
  type?: string
  startDate?: string
  endDate?: string
  regimeType?: string
  position?: string
  headcount?: number
  expectedStart?: string
  reason?: string
  note?: string
}
export interface IApprovalItem {
  id: string
  category: "application" | "password_reset" | "recruitment_proposal"
  employeeId: string
  employeeName: string
  createdAt: string
  status: string
  details: IApprovalDetails
}
export declare const approvalApi: {
  getPendingApprovals: () => Promise<IApprovalItem[]>
  processApproval: (
    category: string,
    id: string,
    status: IApplicationStatus,
    rejectReason?: string,
  ) => Promise<{
    tempPassword?: string
  } | null>
}
