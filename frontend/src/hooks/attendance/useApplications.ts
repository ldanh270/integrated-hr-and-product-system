import { applicationApi } from "@/lib/api/application.api"
import type { ICreateApplicationRequest } from "@/lib/api/application.api"
import type { IApplication } from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useApplications = () => {
  const queryClient = useQueryClient()

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", "my"],
    queryFn: () => applicationApi.getMyApplications(),
  })

  const createMutation = useMutation({
    mutationFn: (data: ICreateApplicationRequest) => applicationApi.createApplication(data),
    onSuccess: () => {
      toast.success("Gửi đơn thành công!")
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi gửi đơn")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => applicationApi.cancelApplication(id),
    onSuccess: () => {
      toast.success("Đã hủy đơn thành công")
      queryClient.invalidateQueries({ queryKey: ["applications", "my"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn")
    },
  })

  return {
    applications,
    isLoading,
    createApplication: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancelApplication: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  }
}
