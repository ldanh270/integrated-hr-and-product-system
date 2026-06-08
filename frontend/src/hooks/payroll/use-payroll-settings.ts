import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type { IPayrollSettings } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function usePayrollSettings() {
  return useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.PAYROLL.BASE}/settings`)
      const data = response.data?.data || response.data
      console.log("FETCHED SETTINGS FROM API:", data)
      return data as IPayrollSettings
    },
  })
}

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Pick<IPayrollSettings, "triggerDay">) => {
      const response = await apiClient.put(`${API_ENDPOINTS.PAYROLL.BASE}/settings`, data)
      const resData = response.data?.data || response.data
      return resData as IPayrollSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-settings"] })
    },
  })
}
