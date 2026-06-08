import apiClient from "@/lib/api-client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface ISalaryVariable {
  id: string
  code: string
  name: string
  value: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ICreateSalaryVariableDTO {
  code: string
  name: string
  value: number
  description?: string
}

export interface IUpdateSalaryVariableDTO extends Partial<ICreateSalaryVariableDTO> {
  isActive?: boolean
}

const ENDPOINT = "/salary-variables"
const QUERY_KEY = ["salary-variables"]

export function useSalaryVariables(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ISalaryVariable[] }>(ENDPOINT, {
        params,
      })
      return data.data
    },
  })
}

export function useSalaryVariable(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ISalaryVariable }>(`${ENDPOINT}/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ICreateSalaryVariableDTO) => {
      const { data } = await apiClient.post<{ data: ISalaryVariable }>(ENDPOINT, payload)
      return data.data
    },
    onSuccess: () => {
      toast.success("Salary variable created successfully")
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to create variable")
    },
  })
}

export function useUpdateSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: IUpdateSalaryVariableDTO }) => {
      const { data } = await apiClient.put<{ data: ISalaryVariable }>(`${ENDPOINT}/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      toast.success("Salary variable updated successfully")
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to update variable")
    },
  })
}

export function useDeleteSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${ENDPOINT}/${id}`)
    },
    onSuccess: () => {
      toast.success("Salary variable deleted successfully")
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to delete variable")
    },
  })
}
