import type { ContractStatus, ContractType } from "@/config/entities/employee-contract.config.ts"

export interface IContract {
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
  allowances?: IAllowanceItem[]
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

export interface IAllowanceItem {
  type: string
  value: number
  isTaxable: boolean
}

export interface ICreateContractPayload {
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
  allowances?: IAllowanceItem[]
  attachments?: string[]
  probationSalary?: number
  probationSalaryRate?: number
  note?: string
}

export interface IUpdateContractPayload {
  contractType?: ContractType
  contractNumber?: string
  title?: string
  signedDate?: string
  startDate?: string
  endDate?: string
  trialEndDate?: string
  salary?: number
  currency?: string
  allowances?: IAllowanceItem[]
  attachments?: string[]
  probationSalary?: number
  probationSalaryRate?: number
  note?: string
  status?: ContractStatus
}

export interface ITerminateContractPayload {
  terminationReason: string
  terminationDate?: string
}

export interface IRenewContractPayload {
  newContract: ICreateContractPayload
}

export interface IPaginatedContracts {
  data: IContract[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
