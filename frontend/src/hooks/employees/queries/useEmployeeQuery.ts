import { employeeApi } from "@/lib/api/employee.api"
import type {
  CreateEmployeeDto,
  EmployeeListQuery,
  UpdateEmployeeDto,
  UpdateStatusDto,
} from "@/types/employee.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (query: EmployeeListQuery) => [...employeeKeys.lists(), query] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

export function useEmployees(query: EmployeeListQuery) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: () => employeeApi.list(query),
    placeholderData: (previousData) => previousData,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeeApi.create(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      employeeApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(employeeKeys.detail(variables.id), data)
      return queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusDto }) =>
      employeeApi.updateStatus(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(employeeKeys.detail(variables.id), data)
      return queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
