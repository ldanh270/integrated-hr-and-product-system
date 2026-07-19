import { IContractStatus, IContractType } from "@/configs/entities/employee-contract.config.ts"

export type ContractStatus = IContractStatus
export type ContractType = IContractType

export interface EmployeeContract {
  id: string
  employeeId: string
  contractType: ContractType
  contractNumber: string
  title?: string | null
  signedDate?: string | null
  startDate: string
  endDate?: string | null
  trialEndDate?: string | null
  salary: number
  currency: string
  allowances?: AllowanceItem[]
  attachments?: string[]
  status: ContractStatus
  terminationReason?: string | null
  terminationDate?: string | null
  probationSalary?: number | null
  probationSalaryRate?: number | null
  createdById: string
  updatedById?: string | null
  note?: string | null
  renewedFromId?: string | null
  createdAt: string
  updatedAt: string
}

export interface AllowanceItem {
  type: string
  value: number
  isTaxable: boolean
}

export interface CreateContractDto {
  employeeId: string
  contractType: ContractType
  contractNumber: string
  title?: string
  signedDate?: string
  startDate: string
  endDate?: string
  trialEndDate?: string
  salary: number
  currency?: string
  allowances?: AllowanceItem[]
  attachments?: string[]
  probationSalary?: number
  probationSalaryRate?: number
  note?: string
}

export interface UpdateContractDto {
  contractType?: ContractType
  contractNumber?: string
  title?: string
  signedDate?: string
  startDate?: string
  endDate?: string
  trialEndDate?: string
  salary?: number
  currency?: string
  allowances?: AllowanceItem[]
  attachments?: string[]
  probationSalary?: number
  probationSalaryRate?: number
  note?: string
}

export interface TerminateContractDto {
  terminationReason: string
  terminationDate?: string
}

export interface RenewContractDto {
  newContract: CreateContractDto
}

export interface ContractListQuery {
  employeeId?: string
  status?: ContractStatus
  type?: ContractType
  page?: number
  limit?: number
}

export interface PaginatedContracts {
  data: EmployeeContract[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
