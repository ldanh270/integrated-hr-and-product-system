import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectRoleApi } from "@/lib/api/project-role.api"
import type { CreateProjectRoleDto, UpdateProjectRoleDto } from "@/types/project-role.types"
import { toast } from "sonner"

export function useProjectRoles(projectId: string) {
  return useQuery({
    queryKey: ["projectRoles", projectId],
    queryFn: () => projectRoleApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useCreateProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectRoleDto) => projectRoleApi.create(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      toast.success("Đã thêm vai trò dự án mới")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Thêm vai trò thất bại"
      toast.error(msg)
    },
  })
}

export function useUpdateProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRoleDto }) =>
      projectRoleApi.update(projectId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] })
      toast.success("Đã cập nhật vai trò dự án")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Cập nhật vai trò thất bại"
      toast.error(msg)
    },
  })
}

export function useDeleteProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectRoleApi.delete(projectId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] })
      toast.success("Đã xóa vai trò dự án")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Xóa vai trò thất bại"
      toast.error(msg)
    },
  })
}
