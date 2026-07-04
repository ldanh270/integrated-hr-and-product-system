import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectTrackerApi } from "@/lib/api/project-tracker.api"
import type { CreateProjectTrackerDto, UpdateProjectTrackerDto } from "@/types/project-tracker.types"
import { toast } from "sonner"

export function useProjectTrackers(projectId: string) {
  return useQuery({
    queryKey: ["projectTrackers", projectId],
    queryFn: () => projectTrackerApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useCreateProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectTrackerDto) => projectTrackerApi.create(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      toast.success("Đã thêm loại yêu cầu mới")
    },
    onError: (err: any) => {
      toast.error(err.message || "Thêm loại yêu cầu thất bại")
    },
  })
}

export function useUpdateProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTrackerDto }) =>
      projectTrackerApi.update(projectId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Đã cập nhật loại yêu cầu")
    },
    onError: (err: any) => {
      toast.error(err.message || "Cập nhật loại yêu cầu thất bại")
    },
  })
}

export function useDeleteProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectTrackerApi.delete(projectId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Đã xóa loại yêu cầu")
    },
    onError: (err: any) => {
      toast.error(err.message || "Xóa loại yêu cầu thất bại")
    },
  })
}
