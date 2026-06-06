import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type { IEmployeeSalaryConfig, IPayslipTemplate, ICustomSalaryField } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useActiveSalaryConfig(employeeId: string) {
  return useQuery({
    queryKey: ["employee-salary-config", "active", employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config`,
      )
      return response.data.data as IEmployeeSalaryConfig | null
    },
    enabled: !!employeeId,
  })
}

export function useSalaryConfigHistory(employeeId: string) {
  return useQuery({
    queryKey: ["employee-salary-config", "history", employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config/history`,
      )
      return response.data.data as IEmployeeSalaryConfig[]
    },
    enabled: !!employeeId,
  })
}

export function useAssignSalaryConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      ...data
    }: Omit<IEmployeeSalaryConfig, "id" | "employeeId" | "createdAt" | "updatedAt"> & {
      employeeId: string
    }) => {
      const response = await apiClient.post(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config`,
        data,
      )
      return response.data.data as IEmployeeSalaryConfig
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["employee-salary-config", "active", variables.employeeId],
      })
      queryClient.invalidateQueries({
        queryKey: ["employee-salary-config", "history", variables.employeeId],
      })
      queryClient.invalidateQueries({
        queryKey: ["employees"], // Invalidate employee list to update display salaries
      })
    },
  })
}

export function usePayslipTemplates() {
  return useQuery({
    queryKey: ["payslip-templates"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES)
      return response.data.data as IPayslipTemplate[]
    },
  })
}

export function useCustomSalaryFields() {
  return useQuery({
    queryKey: ["custom-salary-fields"],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.PAYROLL.BASE}/custom-fields`)
      return response.data.data as ICustomSalaryField[]
    },
  })
}

export function useCreateCustomSalaryField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<ICustomSalaryField, "id" | "isActive" | "createdAt" | "updatedAt">) => {
      const response = await apiClient.post(`${API_ENDPOINTS.PAYROLL.BASE}/custom-fields`, data)
      return response.data.data as ICustomSalaryField
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-salary-fields"] })
    },
  })
}

export function useUpdateCustomSalaryField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ICustomSalaryField> & { id: string }) => {
      const response = await apiClient.put(`${API_ENDPOINTS.PAYROLL.BASE}/custom-fields/${id}`, data)
      return response.data.data as ICustomSalaryField
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-salary-fields"] })
    },
  })
}

export function useDeleteCustomSalaryField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`${API_ENDPOINTS.PAYROLL.BASE}/custom-fields/${id}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-salary-fields"] })
    },
  })
}
