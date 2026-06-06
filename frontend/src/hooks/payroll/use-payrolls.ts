import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type { IPayslip } from "@/types/payroll.types"

import { useQuery } from "@tanstack/react-query"

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

// Additional payroll hooks (usePayrolls, useGeneratePayroll, useApprovePayroll, useRejectPayroll)
// will be added in Phase 5.
