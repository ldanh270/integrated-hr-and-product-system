import { type IListBatchesQuery, applicationBatchApi } from "@/lib/api/application-batch.api"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const QUERY_KEY = "application-batches-mine"

export function useMyBatches(query?: IListBatchesQuery) {
  const queryClient = useQueryClient()

  const batchesQuery = useQuery({
    queryKey: [QUERY_KEY, query],
    queryFn: () => applicationBatchApi.listMine(query),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => applicationBatchApi.cancel(id),
    onSuccess: () => {
      toast.success("Đã hủy đơn thành công")
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error.response?.data?.error?.message || "Lỗi khi hủy đơn")
    },
  })

  return {
    batches: batchesQuery.data?.data ?? [],
    meta: batchesQuery.data?.meta,
    isLoading: batchesQuery.isLoading,
    refetch: batchesQuery.refetch,
    handleCancel: (id: string) => { cancelMutation.mutate(id) },
    cancellingId: cancelMutation.isPending ? (cancelMutation.variables as string) : null,
  }
}
