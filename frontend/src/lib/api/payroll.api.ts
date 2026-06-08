// --- Salary Components ---
import apiClient from "@/lib/api-client.ts"
import type {
  IPayroll,
  IPayrollWithPayslips,
  IPayslipTemplate,
  ISalaryComponent,
} from "@/types/payroll.types.ts"

export const getSalaryComponents = async (params?: { type?: string; isActive?: boolean }) => {
  const response = await apiClient.get<{ data: ISalaryComponent[] }>("/salary-components", {
    params,
  })
  return response.data.data
}

export const createSalaryComponent = async (data: Partial<ISalaryComponent>) => {
  const response = await apiClient.post<{ data: ISalaryComponent }>("/salary-components", data)
  return response.data.data
}

// --- Payslip Templates ---

export const getPayslipTemplates = async (params?: { isActive?: boolean }) => {
  const response = await apiClient.get<{ data: IPayslipTemplate[] }>("/payslip-templates", {
    params,
  })
  return response.data.data
}

export interface ICreatePayslipTemplatePayload {
  name: string
  description?: string
  components: Array<{
    componentId: string
    overrideFormula?: string
  }>
}

export const createPayslipTemplate = async (data: ICreatePayslipTemplatePayload) => {
  const response = await apiClient.post<{ data: IPayslipTemplate }>("/payslip-templates", data)
  return response.data.data
}

export const updatePayslipTemplate = async (
  id: string,
  data: Partial<ICreatePayslipTemplatePayload> & { isActive?: boolean },
) => {
  const response = await apiClient.put<{ data: IPayslipTemplate }>(`/payslip-templates/${id}`, data)
  return response.data.data
}

export const deletePayslipTemplate = async (id: string) => {
  const response = await apiClient.delete(`/payslip-templates/${id}`)
  return response.data
}

// --- Payrolls ---

export const getPayrolls = async (params?: { status?: string; year?: number }) => {
  const response = await apiClient.get<{ data: IPayroll[] }>("/payrolls", { params })
  return response.data.data
}

export const getPayrollDetails = async (id: string) => {
  const response = await apiClient.get<{ data: IPayrollWithPayslips }>(`/payrolls/${id}`)
  return response.data.data
}

export const generatePayroll = async (data: { month: number; year: number; name?: string }) => {
  const response = await apiClient.post<{ data: IPayroll }>("/payrolls/generate", data)
  return response.data.data
}

export const approvePayroll = async (id: string) => {
  const response = await apiClient.post<{ data: IPayroll }>(`/payrolls/${id}/approve`)
  return response.data.data
}

export const rejectPayroll = async (id: string, reason: string) => {
  const response = await apiClient.post<{ data: IPayroll }>(`/payrolls/${id}/reject`, { reason })
  return response.data.data
}
