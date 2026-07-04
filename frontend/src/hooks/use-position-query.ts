import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { positionApi } from "@/lib/api/position.api"
import type { UpdatePositionDto, ProjectPositionRuleDto } from "@/lib/api/position.api"

const positionKeys = {
  all: ["positions"] as const,
  lists: () => [...positionKeys.all, "list"] as const,
  details: () => [...positionKeys.all, "detail"] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
  projectRulesAll: () => [...positionKeys.all, "project-rules"] as const,
  projectRules: (projectId: string) => [...positionKeys.projectRulesAll(), projectId] as const,
}

export function usePositions() {
  return useQuery({
    queryKey: positionKeys.lists(),
    queryFn: positionApi.list,
  })
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => positionApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreatePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: positionApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionDto }) => positionApi.update(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: positionKeys.detail(variables.id) })
    },
  })
}

export function useDeletePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: positionApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

export function useProjectPositionRules(projectId: string) {
  return useQuery({
    queryKey: positionKeys.projectRules(projectId),
    queryFn: () => positionApi.listProjectRules(projectId),
    enabled: !!projectId,
  })
}

export function useSaveProjectPositionRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, rules }: { projectId: string; rules: ProjectPositionRuleDto[] }) =>
      positionApi.saveProjectRules(projectId, rules),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.projectRules(variables.projectId) })
    },
  })
}
