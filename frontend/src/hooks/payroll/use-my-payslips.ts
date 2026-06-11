import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type { IPayslip } from "@/types/payroll.types"

import { useQuery } from "@tanstack/react-query"

export function useMyPayslips() {
  return useQuery({
    queryKey: ["my-payslips"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.MY_PAYSLIPS)
      return response.data.data as IPayslip[]
    },
  })
}
