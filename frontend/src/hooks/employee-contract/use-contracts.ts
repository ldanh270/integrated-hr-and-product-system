import {
  CONTRACT_QUERY_KEYS,
} from "@/config/entities/employee-contract.config"
import {
  createContract,
  deleteContract,
  getContractById,
  getContracts,
  getContractsByEmployee,
  getExpiringContracts,
  renewContract,
  terminateContract,
  updateContract,
} from "@/lib/api/employee-contract.api"
import type {
  ICreateContractPayload,
  IRenewContractPayload,
  ITerminateContractPayload,
  IUpdateContractPayload,
} from "@/types/employee-contract.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const CONTRACT_MESSAGES = {
  CREATE: "Tạo hợp đồng thành công",
  UPDATE: "Cập nhật hợp đồng thành công",
  DELETE: "Xóa hợp đồng thành công",
  TERMINATE: "Chấm dứt hợp đồng thành công",
  RENEW: "Gia hạn hợp đồng thành công",
  ERROR: "Có lỗi xảy ra",
}

export function useContracts(params?: {
  employeeId?: string
  status?: string
  type?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: [...CONTRACT_QUERY_KEYS.LIST, params],
    queryFn: () => getContracts(params),
  })
}

export function useContract(id: string | null) {
  return useQuery({
    queryKey: [...CONTRACT_QUERY_KEYS.DETAIL, id],
    queryFn: () => getContractById(id!),
    enabled: !!id,
  })
}

export function useEmployeeContracts(employeeId: string | null, includeInactive = false) {
  return useQuery({
    queryKey: [...CONTRACT_QUERY_KEYS.EMPLOYEE(employeeId || ""), includeInactive],
    queryFn: () => getContractsByEmployee(employeeId!, includeInactive),
    enabled: !!employeeId,
  })
}

export function useExpiringContracts(days = 30) {
  return useQuery({
    queryKey: [...CONTRACT_QUERY_KEYS.EXPIRING, days],
    queryFn: () => getExpiringContracts(days),
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateContractPayload) => createContract(data),
    onSuccess: () => {
      toast.success(CONTRACT_MESSAGES.CREATE)
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.LIST })
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.EMPLOYEE("") })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || CONTRACT_MESSAGES.ERROR)
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateContractPayload }) =>
      updateContract(id, data),
    onSuccess: () => {
      toast.success(CONTRACT_MESSAGES.UPDATE)
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.LIST })
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.DETAIL })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || CONTRACT_MESSAGES.ERROR)
    },
  })
}

export function useTerminateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ITerminateContractPayload }) =>
      terminateContract(id, data),
    onSuccess: () => {
      toast.success(CONTRACT_MESSAGES.TERMINATE)
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.LIST })
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.EMPLOYEE("") })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || CONTRACT_MESSAGES.ERROR)
    },
  })
}

export function useRenewContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IRenewContractPayload }) =>
      renewContract(id, data),
    onSuccess: () => {
      toast.success(CONTRACT_MESSAGES.RENEW)
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.LIST })
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.EMPLOYEE("") })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || CONTRACT_MESSAGES.ERROR)
    },
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      toast.success(CONTRACT_MESSAGES.DELETE)
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.LIST })
      queryClient.invalidateQueries({ queryKey: CONTRACT_QUERY_KEYS.EMPLOYEE("") })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || CONTRACT_MESSAGES.ERROR)
    },
  })
}
