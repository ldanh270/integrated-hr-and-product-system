import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import {
  approvePayroll,
  generatePayroll,
  getPayrollDetails,
  getPayrolls,
  rejectPayroll,
} from "@/lib/api/payroll.api"
import type { IPayslip } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function usePayslip(payrollId: string | null, employeeId: string | null) {
  return useQuery({
    queryKey: ["payslip", payrollId, employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.BASE}/${payrollId}/payslips/${employeeId}`,
      )
      return response.data.data as IPayslip
    },
    enabled: !!payrollId && !!employeeId,
  })
}

export function usePayrolls(params?: { status?: string; year?: number }) {
  return useQuery({
    queryKey: ["payrolls", params],
    queryFn: () => getPayrolls(params),
  })
}

export function usePayrollDetails(id: string) {
  return useQuery({
    queryKey: ["payrollDetails", id],
    queryFn: () => getPayrollDetails(id),
    enabled: !!id,
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generatePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      toast.success("Payroll generated successfully.")
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || "Failed to generate payroll")
    },
  })
}

export function useApprovePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approvePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      toast.success("Payroll approved successfully.")
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || "Failed to approve payroll")
    },
  })
}

export function useRejectPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPayroll(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      toast.success("Payroll rejected.")
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || "Failed to reject payroll")
    },
  })
}

export function useEmployeePayslipsHistory(employeeId: string | null) {
  return useQuery({
    queryKey: ["payslips-history", employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.BASE}/employee/${employeeId}/payslips`,
      )
      // the endpoint might return an array if modified, but getMyPayslips returns an array. Let's cast it
      return response.data.data as IPayslip[]
    },
    enabled: !!employeeId,
  })
}
